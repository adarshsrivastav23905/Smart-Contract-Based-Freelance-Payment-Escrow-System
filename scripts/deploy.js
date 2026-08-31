/**
 * @file deploy.js
 * @notice Deployment script for the FreelanceEscrow smart contract.
 *
 * Usage:
 *   Local:   npx hardhat run scripts/deploy.js --network localhost
 *   Testnet: npx hardhat run scripts/deploy.js --network sepolia
 *   Default: npx hardhat run scripts/deploy.js   (uses in-memory Hardhat network)
 */
   
const hre = require("hardhat");

async function main() {
  console.log("=".repeat(60));
  console.log("  FreelanceEscrow — Deployment Script");
  console.log("=".repeat(60));

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployer address :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance :", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  console.log("\nDeploying FreelanceEscrow...");
  const FreelanceEscrow = await hre.ethers.getContractFactory("FreelanceEscrow");
  const escrow = await FreelanceEscrow.deploy();

  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  console.log("\n✅ FreelanceEscrow deployed successfully!");
  console.log("   Contract address:", contractAddress);
  console.log("   Arbitrator      :", deployer.address);
  console.log("   Network         :", hre.network.name);

  console.log("\n" + "=".repeat(60));
  console.log("  Deployment Complete");
  console.log("=".repeat(60));

  // If deploying to a live network, remind the user to verify
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n💡 TIP: Verify your contract on Etherscan:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  }
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  });
