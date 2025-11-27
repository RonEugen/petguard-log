import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the PetGuard contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the PetGuard contract
 *
 *   npx hardhat --network localhost task:create-log --type 0 --title "Morning Feeding" --description "Fed 2 cups"
 *   npx hardhat --network localhost task:get-log --logId 0
 *   npx hardhat --network localhost task:decrypt-log --logId 0
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the PetGuard contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the PetGuard contract
 *
 *   npx hardhat --network sepolia task:create-log --type 0 --title "Morning Feeding" --description "Fed 2 cups"
 *   npx hardhat --network sepolia task:get-log --logId 0
 *   npx hardhat --network sepolia task:decrypt-log --logId 0
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the PetGuard address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const petGuard = await deployments.get("PetGuard");

  console.log("PetGuard address is " + petGuard.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:create-log --type 0 --title "Morning Feeding" --description "Fed 2 cups" --sensitive 100
 *   - npx hardhat --network sepolia task:create-log --type 1 --title "Medication" --description "Administered" --sensitive 50
 */
task("task:create-log", "Creates a new care log entry")
  .addOptionalParam("address", "Optionally specify the PetGuard contract address")
  .addParam("type", "Log type: 0=feeding, 1=medication, 2=activity")
  .addParam("title", "Title of the care log")
  .addParam("description", "Description of the care log")
  .addOptionalParam("sensitive", "Sensitive data value to encrypt (optional)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const PetGuardDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("PetGuard");
    console.log(`PetGuard: ${PetGuardDeployment.address}`);

    const signers = await ethers.getSigners();
    const petGuardContract = await ethers.getContractAt("PetGuard", PetGuardDeployment.address);

    const logType = parseInt(taskArguments.type);
    const title = taskArguments.title;
    const description = taskArguments.description;
    const hasSensitive = taskArguments.sensitive !== undefined && taskArguments.sensitive !== "";

    let encryptedSensitiveData: any = { handle: ethers.ZeroHash };
    let inputProof = "0x";

    if (hasSensitive) {
      const sensitiveValue = parseInt(taskArguments.sensitive);
      if (!Number.isInteger(sensitiveValue)) {
        throw new Error(`Argument --sensitive is not an integer`);
      }

      // Encrypt the sensitive value
      const encryptedValue = await fhevm
        .createEncryptedInput(PetGuardDeployment.address, signers[0].address)
        .add32(sensitiveValue)
        .encrypt();

      encryptedSensitiveData = encryptedValue.handles[0];
      inputProof = encryptedValue.inputProof;
    }

    const tx = await petGuardContract
      .connect(signers[0])
      .createCareLog(logType, title, description, encryptedSensitiveData, inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const logId = await petGuardContract.getTotalLogs();
    console.log(`Care log created with ID: ${logId - 1n}`);
    console.log(`PetGuard createCareLog succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-log --logId 0
 *   - npx hardhat --network sepolia task:get-log --logId 0
 */
task("task:get-log", "Gets a care log by ID")
  .addOptionalParam("address", "Optionally specify the PetGuard contract address")
  .addParam("logId", "The ID of the log to retrieve")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const PetGuardDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("PetGuard");
    console.log(`PetGuard: ${PetGuardDeployment.address}`);

    const petGuardContract = await ethers.getContractAt("PetGuard", PetGuardDeployment.address);

    const logId = parseInt(taskArguments.logId);
    const log = await petGuardContract.getCareLog(logId);

    console.log(`Log ID: ${logId}`);
    console.log(`Owner: ${log.owner}`);
    console.log(`Type: ${log.logType} (0=feeding, 1=medication, 2=activity)`);
    console.log(`Title: ${log.title}`);
    console.log(`Description: ${log.description}`);
    console.log(`Timestamp: ${log.timestamp}`);
    console.log(`Has Encrypted Data: ${log.hasEncryptedData}`);
    if (log.hasEncryptedData) {
      console.log(`Encrypted Data Handle: ${log.encryptedSensitiveData}`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-log --logId 0
 *   - npx hardhat --network sepolia task:decrypt-log --logId 0
 */
task("task:decrypt-log", "Decrypts the sensitive data of a care log")
  .addOptionalParam("address", "Optionally specify the PetGuard contract address")
  .addParam("logId", "The ID of the log to decrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const PetGuardDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("PetGuard");
    console.log(`PetGuard: ${PetGuardDeployment.address}`);

    const signers = await ethers.getSigners();
    const petGuardContract = await ethers.getContractAt("PetGuard", PetGuardDeployment.address);

    const logId = parseInt(taskArguments.logId);
    const log = await petGuardContract.getCareLog(logId);

    if (!log.hasEncryptedData) {
      console.log("This log does not have encrypted data.");
      return;
    }

    const encryptedData = log.encryptedSensitiveData;
    if (encryptedData === ethers.ZeroHash) {
      console.log("Encrypted data is uninitialized.");
      return;
    }

    const clearData = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedData,
      PetGuardDeployment.address,
      signers[0],
    );
    console.log(`Encrypted data handle: ${encryptedData}`);
    console.log(`Decrypted sensitive data: ${clearData}`);
  });


