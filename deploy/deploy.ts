import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedPetGuard = await deploy("PetGuard", {
    from: deployer,
    log: true,
  });

  console.log(`PetGuard contract: `, deployedPetGuard.address);
};
export default func;
func.id = "deploy_petGuard"; // id required to prevent reexecution
func.tags = ["PetGuard"];


