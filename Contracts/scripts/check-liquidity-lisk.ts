// Contracts/scripts/check-liquidity-lisk.ts
// Inspect GMFOT liquidity held by VaultManager on Lisk Sepolia.
// Usage:
//   npx hardhat run Contracts/scripts/check-liquidity-lisk.ts
// Env required: LISK_RPC_URL, PRIVATE_KEY (without 0x prefix allowed)
// Optional: VAULT_MANAGER_LISK, GMFOT_LISK, BORROW_AMOUNT

import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

// ABIs from artifacts (Hardhat run sets CWD to Contracts/)
const VaultManagerArtifact = require("../artifacts/contracts/VaultManager.sol/VaultManager.json");
const GMFOTArtifact = require("../artifacts/contracts/tokens/GMFOTToken.sol/GMFOTToken.json");
const ERC20Artifact = require("../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

function ensure0x(pk?: string): string {
  if (!pk) throw new Error("PRIVATE_KEY missing in environment");
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function isHexAddress(s?: string): s is `0x${string}` {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

const DEFAULTS = {
  VAULT_MANAGER_LISK: "0x2a8066293B7673824209EA175dD157Dc6469E589" as `0x${string}`,
  GMFOT_LISK: "0x26714a257257EEFb0bE06c9570aA314a3bB77393" as `0x${string}`,
};

async function main() {
  const rpcUrl = process.env.LISK_RPC_URL;
  const pk = ensure0x(process.env.PRIVATE_KEY);
  if (!rpcUrl) throw new Error("LISK_RPC_URL missing in environment");

  const VAULT_MANAGER =
    (process.env.VAULT_MANAGER_LISK as `0x${string}`) || DEFAULTS.VAULT_MANAGER_LISK;
  const GMFOT =
    (process.env.GMFOT_LISK as `0x${string}`) || DEFAULTS.GMFOT_LISK;

  if (!isHexAddress(VAULT_MANAGER)) throw new Error("Invalid VAULT_MANAGER_LISK");
  if (!isHexAddress(GMFOT)) throw new Error("Invalid GMFOT_LISK");

  const BORROW_AMOUNT = process.env.BORROW_AMOUNT || "10";
  const wantWei = ethers.parseUnits(BORROW_AMOUNT, 18);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  const signerAddr = await wallet.getAddress();

  console.log("=== Check Vault GMFOT Liquidity (Lisk Sepolia) ===");
  console.log("RPC:", rpcUrl);
  console.log("Signer:", signerAddr);
  console.log("VaultManager:", VAULT_MANAGER);
  console.log("GMFOT:", GMFOT);
  console.log("Target borrow amount (wei):", wantWei.toString());

  const vm = new ethers.Contract(VAULT_MANAGER, VaultManagerArtifact.abi, wallet);

  // Try to read acceptedBorrowTokens just to confirm configuration
  try {
    const acceptedBorrow: boolean = await vm.acceptedBorrowTokens(GMFOT);
    console.log("acceptedBorrowTokens(GMFOT):", acceptedBorrow);
  } catch (e) {
    console.warn("Warning: cannot read acceptedBorrowTokens on VM:", e);
  }

  // Bind as generic ERC20 for balance/decimals
  const erc20 = new ethers.Contract(GMFOT, ERC20Artifact.abi, wallet);
  // Some custom tokens may not implement decimals(); best-effort
  let decimals = 18;
  try {
    decimals = await erc20.decimals();
  } catch {
    // Fallback to 18
  }

  // Read vault balance
  let vaultBal = 0n;
  try {
    vaultBal = await erc20.balanceOf(VAULT_MANAGER);
  } catch (e) {
    console.error("Error reading GMFOT balanceOf(VaultManager):", e);
  }

  // Read signer balance for possible top-up
  let signerBal = 0n;
  try {
    signerBal = await erc20.balanceOf(signerAddr);
  } catch {
    // ignore
  }

  // Format function
  const fmt = (x: bigint) => {
    try {
      return ethers.formatUnits(x, decimals);
    } catch {
      return x.toString();
    }
  };

  console.log("GMFOT.decimals():", decimals);
  console.log("VaultManager GMFOT balance (raw):", vaultBal.toString());
  console.log("VaultManager GMFOT balance (formatted):", fmt(vaultBal));
  console.log("Signer GMFOT balance (formatted):", fmt(signerBal));

  if (vaultBal < wantWei) {
    const shortfall = wantWei - vaultBal;
    console.log("STATUS: INSUFFICIENT_LIQUIDITY");
    console.log("Shortfall (wei):", shortfall.toString());
    console.log("Shortfall (formatted):", fmt(shortfall));
    console.log(
      "Action: Transfer at least this shortfall amount of GMFOT into the VaultManager address to proceed with borrow."
    );
  } else {
    console.log("STATUS: SUFFICIENT_LIQUIDITY");
    console.log("You can proceed with the borrow for the specified amount.");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});