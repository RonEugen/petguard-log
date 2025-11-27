import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { PetGuard } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("PetGuardSepolia", function () {
  let signers: Signers;
  let petGuardContract: PetGuard;
  let petGuardContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const PetGuardDeployment = await deployments.get("PetGuard");
      petGuardContractAddress = PetGuardDeployment.address;
      petGuardContract = await ethers.getContractAt("PetGuard", PetGuardDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create and decrypt a care log with encrypted data", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    progress("Creating care log without encrypted data...");
    let tx = await petGuardContract
      .connect(signers.alice)
      .createCareLog(0, "Test Feeding", "Test description", { handle: ethers.ZeroHash }, "0x");
    await tx.wait();

    progress("Verifying log creation...");
    const totalLogs = await petGuardContract.getTotalLogs();
    expect(totalLogs).to.be.gt(0n);

    progress("Encrypting sensitive value '100'...");
    const encryptedValue = await fhevm
      .createEncryptedInput(petGuardContractAddress, signers.alice.address)
      .add32(100)
      .encrypt();

    progress(
      `Creating care log with encrypted data PetGuard=${petGuardContractAddress} handle=${ethers.hexlify(encryptedValue.handles[0])} signer=${signers.alice.address}...`
    );
    tx = await petGuardContract
      .connect(signers.alice)
      .createCareLog(
        1,
        "Test Medication",
        "Test medication description",
        encryptedValue.handles[0],
        encryptedValue.inputProof
      );
    await tx.wait();

    progress("Fetching care log...");
    const logId = (await petGuardContract.getTotalLogs()) - 1n;
    const log = await petGuardContract.getCareLog(logId);
    expect(log.hasEncryptedData).to.eq(true);
    expect(log.encryptedSensitiveData).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting encrypted data handle=${log.encryptedSensitiveData}...`);
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      log.encryptedSensitiveData,
      petGuardContractAddress,
      signers.alice
    );
    progress(`Decrypted value=${decryptedValue}`);

    expect(decryptedValue).to.eq(100);
  });
});


