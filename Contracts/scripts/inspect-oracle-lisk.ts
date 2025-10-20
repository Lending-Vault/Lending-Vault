// Contracts/scripts/inspect-oracle-lisk.ts
// Diagnose Lisk Sepolia Oracle wiring and price availability used by VaultManager.
// Usage:
//   npx hardhat run Contracts/scripts/inspect-oracle-lisk.ts
// Env required: LISK_RPC_URL, PRIVATE_KEY (without 0x prefix allowed)
// Optional: VAULT_MANAGER_LISK, ORACLE_MANAGER_LISK, MANUAL_ORACLE_LISK

import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

// Load ABIs from artifacts (Hardhat run sets CWD to Contracts/)
const VaultManagerArtifact = require("../artifacts/contracts/VaultManager.sol/VaultManager.json");
const OracleManagerArtifact = require("../artifacts/contracts/oracles/OracleManager.sol/OracleManager.json");
const PriceOracleArtifact = require("../artifacts/contracts/PriceOracle.sol/PriceOracle.json");

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

// Defaults from frontend config (frontend/src/config/contracts.ts)
const DEFAULTS = {
  VAULT_MANAGER_LISK: "0x2a8066293B7673824209EA175dD157Dc6469E589" as `0x${string}`,
  ORACLE_MANAGER_LISK: "0x54b1F91bcD7E8377Ea1ad55829b2Fb1F6E281524" as `0x${string}`,
  MANUAL_ORACLE_LISK: "0xba57C7Cc575D701612883E92B26c2a219cD83146" as `0x${string}`,
  REDSTONE_ORACLE_LISK: "0xdc78058bE1d9F28003584a972ac09fC3c4Ed67DD" as `0x${string}`,
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

  const VAULT_MANAGER =
    (process.env.VAULT_MANAGER_LISK as `0x${string}`) || DEFAULTS.VAULT_MANAGER_LISK;
  const ORACLE_MANAGER =
    (process.env.ORACLE_MANAGER_LISK as `0x${string}`) || DEFAULTS.ORACLE_MANAGER_LISK;
  const MANUAL_ORACLE =
    (process.env.MANUAL_ORACLE_LISK as `0x${string}`) || DEFAULTS.MANUAL_ORACLE_LISK;

  if (!isHexAddress(VAULT_MANAGER)) throw new Error("Invalid VAULT_MANAGER_LISK");
  if (!isHexAddress(ORACLE_MANAGER)) throw new Error("Invalid ORACLE_MANAGER_LISK");
  if (!isHexAddress(MANUAL_ORACLE)) throw new Error("Invalid MANUAL_ORACLE_LISK");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  const signer = wallet;
  const signerAddr = await signer.getAddress();

  console.log("=== Inspect Lisk Sepolia Oracle Setup ===");
  console.log("RPC:", rpcUrl);
  console.log("Signer:", signerAddr);
  console.log("VaultManager:", VAULT_MANAGER);
  console.log("OracleManager (expected):", ORACLE_MANAGER);
  console.log("Manual Oracle (expected):", MANUAL_ORACLE);

  const vm = new ethers.Contract(VAULT_MANAGER, VaultManagerArtifact.abi, signer);
  const om = new ethers.Contract(ORACLE_MANAGER, OracleManagerArtifact.abi, signer);
  const mo = new ethers.Contract(MANUAL_ORACLE, PriceOracleArtifact.abi, signer);

  // Read VaultManager.priceOracle to confirm it points to OracleManager
  let vmPriceOracle = "0x";
  try {
    vmPriceOracle = await vm.priceOracle();
    console.log("VaultManager.priceOracle():", vmPriceOracle);
  } catch (e) {
    console.error("Error reading VaultManager.priceOracle():", e);
  }

  // Read OracleManager oracles
  try {
    const primary = await om.primaryOracle();
    const secondary = await om.secondaryOracle();
    const manual = await om.manualOracle();
    console.log("OracleManager.primaryOracle():", primary);
    console.log("OracleManager.secondaryOracle():", secondary);
    console.log("OracleManager.manualOracle():", manual);
  } catch (e) {
    console.error("Error reading OracleManager oracle pointers:", e);
  }

  // Try OracleManager.getPrice(NATIVE_ETH)
  try {
    const tx = await om.getPrice(NATIVE_ETH);
    // getPrice in OracleManager is non-view; use callStatic to avoid tx
    // But ethers v6 removed callStatic; instead, do a static call using provider.call on encoded data
    const iface = new ethers.Interface(OracleManagerArtifact.abi);
    const data = iface.encodeFunctionData("getPrice", [NATIVE_ETH]);
    const ret = await provider.call({
      to: ORACLE_MANAGER,
      data,
    });
    const [price] = iface.decodeFunctionResult("getPrice", ret);
    console.log("OracleManager.getPrice(NATIVE_ETH) =>", price.toString());
  } catch (e: any) {
    console.error("OracleManager.getPrice(NATIVE_ETH) reverted:", e?.shortMessage || e?.message || e);
  }

  // Try ManualOracle.getPrice(NATIVE_ETH)
  try {
    const price = await mo.getPrice(NATIVE_ETH);
    console.log("ManualOracle.getPrice(NATIVE_ETH) =>", price.toString());
  } catch (e: any) {
    console.error("ManualOracle.getPrice(NATIVE_ETH) reverted:", e?.shortMessage || e?.message || e);
  }

  // Try ManualOracle.getPrice(GMFOT) if provided via env (optional)
  const GMFOT_LISK =
    (process.env.GMFOT_LISK as `0x${string}`) ||
    ("0x26714a257257EEFb0bE06c9570aA314a3bB77393" as const);
  if (isHexAddress(GMFOT_LISK)) {
    try {
      const price = await mo.getPrice(GMFOT_LISK);
      console.log("ManualOracle.getPrice(GMFOT) =>", price.toString());
    } catch (e: any) {
      console.error("ManualOracle.getPrice(GMFOT) reverted:", e?.shortMessage || e?.message || e);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});