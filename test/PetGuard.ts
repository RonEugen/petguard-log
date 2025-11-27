import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PetGuard, PetGuard__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PetGuard")) as PetGuard__factory;
  const petGuardContract = (await factory.deploy()) as PetGuard;
  const petGuardContractAddress = await petGuardContract.getAddress();

  return { petGuardContract, petGuardContractAddress };
}

describe("PetGuard", function () {
  let signers: Signers;
  let petGuardContract: PetGuard;
  let petGuardContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ petGuardContract, petGuardContractAddress } = await deployFixture());
  });

  it("should create a care log without encrypted data", async function () {
    const tx = await petGuardContract
      .connect(signers.alice)
      .createCareLog(0, "Morning Feeding", "Fed 2 cups of dry food", ethers.ZeroHash, "0x");
    await tx.wait();

    const totalLogs = await petGuardContract.getTotalLogs();
    expect(totalLogs).to.eq(1n);

    const log = await petGuardContract.getCareLog(0);
    expect(log.owner).to.eq(signers.alice.address);
    expect(log.logType).to.eq(0);
    expect(log.title).to.eq("Morning Feeding");
    expect(log.description).to.eq("Fed 2 cups of dry food");
    expect(log.hasEncryptedData).to.eq(false);
  });

  it("should create a care log with encrypted sensitive data", async function () {
    const sensitiveValue = 100; // e.g., medication dosage in mg

    // Encrypt the sensitive value
    const encryptedValue = await fhevm
      .createEncryptedInput(petGuardContractAddress, signers.alice.address)
      .add32(sensitiveValue)
      .encrypt();

    const tx = await petGuardContract
      .connect(signers.alice)
      .createCareLog(
        1,
        "Heartworm Medication",
        "Monthly prevention administered",
        encryptedValue.handles[0],
        encryptedValue.inputProof
      );
    await tx.wait();

    const log = await petGuardContract.getCareLog(0);
    expect(log.owner).to.eq(signers.alice.address);
    expect(log.logType).to.eq(1);
    expect(log.title).to.eq("Heartworm Medication");
    expect(log.hasEncryptedData).to.eq(true);
    expect(log.encryptedSensitiveData).to.not.eq(ethers.ZeroHash);
  });

  it("should allow owner to decrypt their own encrypted data", async function () {
    const sensitiveValue = 50; // e.g., weight in kg

    // Encrypt the sensitive value
    const encryptedValue = await fhevm
      .createEncryptedInput(petGuardContractAddress, signers.alice.address)
      .add32(sensitiveValue)
      .encrypt();

    const tx = await petGuardContract
      .connect(signers.alice)
      .createCareLog(
        2,
        "Weight Check",
        "Regular weight monitoring",
        encryptedValue.handles[0],
        encryptedValue.inputProof
      );
    await tx.wait();

    const log = await petGuardContract.getCareLog(0);
    const encryptedData = log.encryptedSensitiveData;

    // Decrypt the data as the owner
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedData,
      petGuardContractAddress,
      signers.alice
    );

    expect(decryptedValue).to.eq(sensitiveValue);
  });

  it("should return all logs for an owner", async function () {
    // Create multiple logs for alice
    await (
      await petGuardContract
        .connect(signers.alice)
        .createCareLog(0, "Breakfast", "Morning meal", ethers.ZeroHash, "0x")
    ).wait();

    await (
      await petGuardContract
        .connect(signers.alice)
        .createCareLog(1, "Medication", "Daily dose", ethers.ZeroHash, "0x")
    ).wait();

    // Create a log for bob
    await (
      await petGuardContract
        .connect(signers.bob)
        .createCareLog(2, "Activity", "Evening walk", ethers.ZeroHash, "0x")
    ).wait();

    const aliceLogs = await petGuardContract.getOwnerLogs(signers.alice.address);
    expect(aliceLogs.length).to.eq(2);
    expect(aliceLogs[0]).to.eq(0n);
    expect(aliceLogs[1]).to.eq(1n);

    const bobLogs = await petGuardContract.getOwnerLogs(signers.bob.address);
    expect(bobLogs.length).to.eq(1);
    expect(bobLogs[0]).to.eq(2n);
  });

  it("should reject empty title", async function () {
    await expect(
      petGuardContract
        .connect(signers.alice)
        .createCareLog(0, "", "Description", ethers.ZeroHash, "0x")
    ).to.be.revertedWith("Title cannot be empty");
  });

  it("should reject invalid log type", async function () {
    await expect(
      petGuardContract
        .connect(signers.alice)
        .createCareLog(3, "Title", "Description", ethers.ZeroHash, "0x")
    ).to.be.revertedWith("Invalid log type");
  });
});


