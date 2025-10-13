import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const { PRIVATE_KEY, SEPOLIA_RPC, LISK_RPC } = process.env;

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    "ethereum-sepolia": {
      url: SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts,
    },
    "lisk-sepolia": {
      url: LISK_RPC || "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts,
    },
  },
};

export default config;