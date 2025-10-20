// Contracts/scripts/borrow-lisk.ts
// Submits a borrow transaction on Lisk Sepolia VaultManager, borrowing GMFOT with ETH collateral.
// Usage:
//   npx hardhat run Contracts/scripts/borrow-lisk.ts
// Env required in Contracts/.env: PRIVATE_KEY (without 0x prefix allowed), LISK_RPC_URL
// Optional overrides: VAULT_MANAGER_LISK, GMFOT_LISK, BORROW_AMOUNT (defaults to 10)

import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

// Load VaultManager ABI from artifacts (Hardhat run sets CWD to Contracts/)
// If moving this script, adjust relative path accordingly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const VaultManagerArtifact = require("../artifacts/contracts/VaultManager.sol/VaultManager.json");
const VaultManagerABI = VaultManagerArtifact.abi;

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

function ensure0x(pk?: string): string {
  if (!pk) throw new Error("PRIVATE_KEY missing in environment");
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function isHexAddress(s?: string): s is `0x${string}` {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

const LISK_VAULT_MANAGER: `0x${string}` =
  (process.env.VAULT_MANAGER_LISK as `0x${string}`) ||
  ("0x2a8066293B7673824209EA175dD157Dc6469E589" as const);

const GMFOT_LISK: `0x${string}` =
  (process.env.GMFOT_LISK as `0x${string}`) ||
  ("0x26714a257257EEFb0bE06c9570aA314a3bB77393" as const);

const BORROW_AMOUNT_STR: string = process.env.BORROW_AMOUNT || "10";

async function main() {
  const pk = ensure0x(process.env.PRIVATE_KEY);
  const rpcUrl = process.env.LISK_RPC_URL;
  if (!rpcUrl) throw new Error("LISK_RPC_URL missing in environment");

  if (!isHexAddress(LISK_VAULT_MANAGER) || !isHexAddress(GMFOT_LISK)) {
    throw new Error("Invalid Lisk addresses; set VAULT_MANAGER_LISK and GMFOT_LISK env vars.");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  const signerAddr = await wallet.getAddress();

  console.log("=== Borrow GMFOT on Lisk Sepolia ===");
  console.log("RPC:", rpcUrl);
  console.log("Signer:", signerAddr);
  console.log("VaultManager:", LISK_VAULT_MANAGER);
  console.log("GMFOTToken:", GMFOT_LISK);
  console.log("CollateralToken (native ETH marker):", NATIVE_ETH);
  console.log("Borrow amount (GMFOT):", BORROW_AMOUNT_STR);

  const vm = new ethers.Contract(LISK_VAULT_MANAGER, VaultManagerABI, wallet);

  // Sanity checks
  const acceptedBorrow: boolean = await vm.acceptedBorrowTokens(GMFOT_LISK);
  console.log("acceptedBorrowTokens(GMFOT):", acceptedBorrow);
  if (!acceptedBorrow) {
    throw new Error("GMFOT is not registered as an accepted borrow token on VaultManager.");
  }

  const acceptedColl: boolean = await vm.acceptedCollateral(NATIVE_ETH);
  console.log("acceptedCollateral(NATIVE_ETH):", acceptedColl);
  if (!acceptedColl) {
    throw new Error("Native ETH has not been registered as accepted collateral on VaultManager.");
  }

  const deposited: bigint = await vm.collateral(signerAddr, NATIVE_ETH);
  console.log("Your deposited ETH collateral (wei):", deposited.toString());
  if (deposited === 0n) {
    throw new Error("No ETH collateral found for your address. Deposit before borrowing.");
  }

  // Skipping pre-transaction health factor check due to OracleManager.getPrice emitting events,
  // which reverts under STATICCALL from view contexts.

  const amountInWei = ethers.parseUnits(BORROW_AMOUNT_STR, 18);
  console.log("Borrow amount (wei, 18 decimals):", amountInWei.toString());

  console.log("Submitting borrow transaction...");
  const tx = await vm.borrow(NATIVE_ETH, GMFOT_LISK, amountInWei);
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt?.blockNumber);

  // Skipping post-transaction health factor check for the same reason.

  console.log("Borrow completed successfully.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});