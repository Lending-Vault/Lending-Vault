// Contracts/scripts/set-lisk-prices.ts
// Populate Manual PriceOracle prices on Lisk Sepolia so VaultManager can compute LTV and allow borrow.
// Usage:
//   npx hardhat run Contracts/scripts/set-lisk-prices.ts
// Env required: PRIVATE_KEY (without 0x prefix allowed), LISK_RPC_URL
// Optional: VAULT_MANAGER_LISK, ORACLE_MANAGER_LISK, MANUAL_ORACLE_LISK, GMFOT_LISK
// Optional prices (in USD, 18 decimals via parseEther): NATIVE_ETH_USD=2000, GMFOT_USD=1

import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

// ABIs from artifacts (Hardhat run sets CWD to Contracts/)
const VaultManagerArtifact = require("../artifacts/contracts/VaultManager.sol/VaultManager.json");
const OracleManagerArtifact = require("../artifacts/contracts/oracles/OracleManager.sol/OracleManager.json");
const PriceOracleArtifact = require("../artifacts/contracts/PriceOracle.sol/PriceOracle.json");

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

// Defaults from frontend/src/config/contracts.ts
const DEFAULTS = {
  VAULT_MANAGER_LISK: "0x2a8066293B7673824209EA175dD157Dc6469E589" as `0x${string}`,
  ORACLE_MANAGER_LISK: "0x54b1F91bcD7E8377Ea1ad55829b2Fb1F6E281524" as `0x${string}`,
  MANUAL_ORACLE_LISK: "0xba57C7Cc575D701612883E92B26c2a219cD83146" as `0x${string}`,
  GMFOT_LISK: "0x26714a257257EEFb0bE06c9570aA314a3bB77393" as `0x${string}`,
};

function ensure0x(pk?: string): string {
  if (!pk) throw new Error("PRIVATE_KEY missing in environment");
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function isHexAddress(s?: string): s is `0x${string}` {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

async function main() {
  const rpcUrl = process.env.LISK_RPC_URL;
  const pk = ensure0x(process.env.PRIVATE_KEY);
  if (!rpcUrl) throw new Error("LISK_RPC_URL missing in environment");

  // Resolve key addresses
  const VAULT_MANAGER =
    (process.env.VAULT_MANAGER_LISK as `0x${string}`) || DEFAULTS.VAULT_MANAGER_LISK;
  const ORACLE_MANAGER_ENV =
    (process.env.ORACLE_MANAGER_LISK as `0x${string}`) || DEFAULTS.ORACLE_MANAGER_LISK;
  const MANUAL_ORACLE_ENV =
    (process.env.MANUAL_ORACLE_LISK as `0x${string}`) || DEFAULTS.MANUAL_ORACLE_LISK;
  const GMFOT_LISK =
    (process.env.GMFOT_LISK as `0x${string}`) || DEFAULTS.GMFOT_LISK;

  if (!isHexAddress(VAULT_MANAGER)) throw new Error("Invalid VAULT_MANAGER_LISK");
  if (!isHexAddress(ORACLE_MANAGER_ENV)) throw new Error("Invalid ORACLE_MANAGER_LISK");
  if (!isHexAddress(MANUAL_ORACLE_ENV)) throw new Error("Invalid MANUAL_ORACLE_LISK");
  if (!isHexAddress(GMFOT_LISK)) throw new Error("Invalid GMFOT_LISK");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  const signerAddr = await wallet.getAddress();

  console.log("=== Set Lisk Sepolia Manual Oracle Prices ===");
  console.log("RPC:", rpcUrl);
  console.log("Signer:", signerAddr);
  console.log("VaultManager (cfg):", VAULT_MANAGER);
  console.log("OracleManager (cfg):", ORACLE_MANAGER_ENV);
  console.log("ManualOracle (cfg):", MANUAL_ORACLE_ENV);
  console.log("GMFOT (cfg):", GMFOT_LISK);

  const vm = new ethers.Contract(VAULT_MANAGER, VaultManagerArtifact.abi, wallet);
  const omCfg = new ethers.Contract(ORACLE_MANAGER_ENV, OracleManagerArtifact.abi, wallet);

  // Verify VaultManager.priceOracle and discover actual OracleManager linked
  let omAddr: string = ORACLE_MANAGER_ENV;
  try {
    const vmPriceOracle = await vm.priceOracle();
    console.log("VaultManager.priceOracle():", vmPriceOracle);
    if (isHexAddress(vmPriceOracle)) {
      omAddr = vmPriceOracle;
    }
  } catch (e) {
    console.warn("Warning: Unable to read VaultManager.priceOracle()", e);
  }

  const om = new ethers.Contract(omAddr, OracleManagerArtifact.abi, wallet);

  // Resolve Manual Oracle address from OracleManager
  let manualOracleAddr: string = MANUAL_ORACLE_ENV;
  try {
    const primary = await om.primaryOracle();
    const manual = await om.manualOracle();
    const secondary = await om.secondaryOracle();
    console.log("OracleManager.primaryOracle():", primary);
    console.log("OracleManager.secondaryOracle():", secondary);
    console.log("OracleManager.manualOracle():", manual);
    if (isHexAddress(manual)) {
      manualOracleAddr = manual;
    }
  } catch (e) {
    console.warn("Warning: Unable to read OracleManager oracles", e);
  }

  if (!isHexAddress(manualOracleAddr)) {
    throw new Error("Manual oracle address is invalid");
  }

  const manualOracle = new ethers.Contract(
    manualOracleAddr,
    PriceOracleArtifact.abi,
    wallet
  );

  // Read owner
  try {
    const owner = await manualOracle.owner();
    console.log("ManualOracle.owner():", owner);
    if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
      console.warn("Signer is NOT the owner of ManualOracle. emergencySetPrice will fail with OnlyOwner.");
    }
  } catch (e) {
    console.warn("Warning: Unable to read ManualOracle.owner()", e);
  }

  // Price inputs
  const ETH_USD_STR = process.env.NATIVE_ETH_USD || "2000";
  const GMFOT_USD_STR = process.env.GMFOT_USD || "1";
  const ethPrice = ethers.parseEther(ETH_USD_STR);
  const gmfotPrice = ethers.parseEther(GMFOT_USD_STR);

  console.log("Setting prices:");
  console.log(`- NATIVE_ETH => $${ETH_USD_STR}`);
  console.log(`- GMFOT      => $${GMFOT_USD_STR}`);

  // Set prices via emergencySetPrice (owner-only)
  try {
    const tx1 = await manualOracle.emergencySetPrice(NATIVE_ETH, ethPrice);
    console.log("emergencySetPrice(NATIVE_ETH) tx:", tx1.hash);
    await tx1.wait();
    console.log("NATIVE_ETH price set.");
  } catch (e: any) {
    console.error("Failed to set NATIVE_ETH price:", e?.shortMessage || e?.message || e);
  }

  try {
    const tx2 = await manualOracle.emergencySetPrice(GMFOT_LISK, gmfotPrice);
    console.log("emergencySetPrice(GMFOT) tx:", tx2.hash);
    await tx2.wait();
    console.log("GMFOT price set.");
  } catch (e: any) {
    console.error("Failed to set GMFOT price:", e?.shortMessage || e?.message || e);
  }

  // Verify reads
  try {
    const pEth = await manualOracle.getPrice(NATIVE_ETH);
    console.log("ManualOracle.getPrice(NATIVE_ETH):", pEth.toString());
  } catch (e: any) {
    console.error("ManualOracle.getPrice(NATIVE_ETH) reverted:", e?.shortMessage || e?.message || e);
  }

  try {
    const pG = await manualOracle.getPrice(GMFOT_LISK);
    console.log("ManualOracle.getPrice(GMFOT):", pG.toString());
  } catch (e: any) {
    console.error("ManualOracle.getPrice(GMFOT) reverted:", e?.shortMessage || e?.message || e);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});