import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const {
  PRIVATE_KEY,
  SEPOLIA_RPC_URL,
  LISK_RPC_URL,
  LISK_MAINNET_RPC_URL,
  ETHEREUM_MAINNET_RPC_URL,
} = process.env;

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    "ethereum-sepolia": {
      url: SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts,
      gasPrice: "auto",
      gas: "auto",
    },
    "ethereum-mainnet": {
      url: ETHEREUM_MAINNET_RPC_URL || "https://ethereum-rpc.publicnode.com",
      chainId: 1,
      accounts,
      gasPrice: "auto",
      gas: "auto",
    },
    "lisk-sepolia": {
      url: LISK_RPC_URL || "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts,
      gasPrice: "auto",
      gas: "auto",
    },
    "lisk-mainnet": {
      url: LISK_MAINNET_RPC_URL || "https://rpc.api.lisk.com",
      chainId: 1135,
      accounts,
      gasPrice: "auto",
      gas: "auto",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
    },
  },
};

export default config;
