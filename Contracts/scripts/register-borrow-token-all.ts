// Contracts/scripts/register-borrow-token-all.ts
// Registers GMFOT as an accepted borrow token in VaultManager on BOTH Sepolia and Lisk Sepolia.
// Usage:
//   npx hardhat run Contracts/scripts/register-borrow-token-all.ts
//
// Requires environment variables in Contracts/.env:
//   PRIVATE_KEY (without 0x prefix), SEPOLIA_RPC_URL, LISK_RPC_URL
//
// Address sources default to the frontend config equivalents. You can override via env:
//   VAULT_MANAGER_SEPOLIA=0x... GMFOT_SEPOLIA=0x...
//   VAULT_MANAGER_LISK=0x...    GMFOT_LISK=0x...

import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

// Load ABI from build artifacts
// Hardhat run sets CWD to Contracts/, so relative import works
// If you relocate, adjust the path accordingly.
const VaultManagerArtifact = require("../artifacts/contracts/VaultManager.sol/VaultManager.json");
const VaultManagerABI = VaultManagerArtifact.abi;

function ensure0x(pk?: string): string {
  if (!pk) throw new Error("PRIVATE_KEY missing in environment");
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function isHexAddress(s?: string): s is `0x${string}` {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

type NetworkTarget = {
  label: string;
  chainId: number;
  rpcUrl?: string;
  vaultManager: `0x${string}`;
  gmfotToken: `0x${string}`;
};

function resolveTargets(): NetworkTarget[] {
  const sepoliaVM =
    (process.env.VAULT_MANAGER_SEPOLIA as `0x${string}`) ||
    ("0xe19E99D644e56644CBd4428957996F9103b7C240" as const);
  const sepoliaGMFOT =
    (process.env.GMFOT_SEPOLIA as `0x${string}`) ||
    ("0x614baD46b1CE22D30e2487DEC7ac4066bD485F5D" as const);

  const liskVM =
    (process.env.VAULT_MANAGER_LISK as `0x${string}`) ||
    ("0x2a8066293B7673824209EA175dD157Dc6469E589" as const);
  const liskGMFOT =
    (process.env.GMFOT_LISK as `0x${string}`) ||
    ("0x26714a257257EEFb0bE06c9570aA314a3bB77393" as const);

  if (!isHexAddress(sepoliaVM) || !isHexAddress(sepoliaGMFOT)) {
    throw new Error("Invalid Sepolia addresses; set VAULT_MANAGER_SEPOLIA and GMFOT_SEPOLIA env vars.");
  }
  if (!isHexAddress(liskVM) || !isHexAddress(liskGMFOT)) {
    throw new Error("Invalid Lisk Sepolia addresses; set VAULT_MANAGER_LISK and GMFOT_LISK env vars.");
  }

  return [
    {
      label: "Ethereum Sepolia",
      chainId: 11155111,
      rpcUrl: process.env.SEPOLIA_RPC_URL,
      vaultManager: sepoliaVM,
      gmfotToken: sepoliaGMFOT,
    },
    {
      label: "Lisk Sepolia",
      chainId: 4202,
      rpcUrl: process.env.LISK_RPC_URL,
      vaultManager: liskVM,
      gmfotToken: liskGMFOT,
    },
  ];
}

async function registerBorrowToken(target: NetworkTarget, wallet: ethers.Wallet) {
  if (!target.rpcUrl) {
    throw new Error(`${target.label}: Missing RPC URL in environment`);
  }

  const provider = new ethers.JsonRpcProvider(target.rpcUrl);
  const signer = wallet.connect(provider);
  const signerAddr = await signer.getAddress();

  console.log(`\n=== ${target.label} (chainId=${target.chainId}) ===`);
  console.log("RPC:", target.rpcUrl);
  console.log("Signer:", signerAddr);
  console.log("VaultManager:", target.vaultManager);
  console.log("GMFOTToken:", target.gmfotToken);

  const vm = new ethers.Contract(target.vaultManager, VaultManagerABI, signer);

  // Validate owner
  try {
    const owner: string = await vm.owner();
    if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
      console.error("Signer is not the VaultManager owner.");
      console.error("owner():", owner);
      return;
    }
  } catch (e) {
    console.warn("Warning: Unable to read owner(); proceeding, but tx may revert if not owner.");
  }

  // Check current state
  const alreadyAccepted: boolean = await vm.acceptedBorrowTokens(target.gmfotToken);
  if (alreadyAccepted) {
    console.log("GMFOT already accepted as borrow token. Skipping.");
    return;
  }

  // Submit addBorrowToken
  console.log("Submitting addBorrowToken...");
  const tx = await vm.addBorrowToken(target.gmfotToken);
  console.log("Tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt?.blockNumber);

  // Verify
  const nowAccepted: boolean = await vm.acceptedBorrowTokens(target.gmfotToken);
  if (!nowAccepted) {
    throw new Error("Post-check failed: acceptedBorrowTokens is still false.");
  }
  console.log("Success: GMFOT registered on", target.label);
}

async function main() {
  const pk = ensure0x(process.env.PRIVATE_KEY);
  const wallet = new ethers.Wallet(pk);

  const targets = resolveTargets();

  for (const t of targets) {
    try {
      await registerBorrowToken(t, wallet);
    } catch (err) {
      console.error(`Error on ${t.label}:`, err);
    }
  }

  console.log("\nAll done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});