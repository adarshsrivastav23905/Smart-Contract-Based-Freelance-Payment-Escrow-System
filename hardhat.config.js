require("@nomicfoundation/hardhat-toolbox");

// Load environment variables if .env file exists
// Uncomment the line below if you install dotenv: npm install dotenv
// require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local Hardhat network (default, no config needed)
    hardhat: {},

    // Local node started with `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // Sepolia testnet (optional — uncomment and add .env values to use)
    // sepolia: {
    //   url: process.env.SEPOLIA_RPC_URL || "",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
