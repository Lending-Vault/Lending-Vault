// Contracts/scripts/register-borrow-token.ts
// Registers GMFOT as an accepted borrow token in VaultManager for the CURRENT Hardhat --network.
// Usage examples:
//   npx hardhat run Contracts/scripts/register-borrow-token.ts --network sepolia
//   npx hardhat run Contracts/scripts/register-borrow-token.ts --network liskSepolia
//
// Optional overrides via environment variables:
//   VAULT_MANAGER_ADDRESS=0x... GMFOT_TOKEN_ADDRESS=0x... npx hardhat run Contracts/scripts/register-borrow-token.ts --network sepolia
//
// Defaults use addresses aligned with the frontend config at:
//   frontend/src/config/contracts.ts

import { ethers, network } from "hardhat";

type HexAddress = `0x${string}`;
type AddressMap = Record<number, { VaultManager: HexAddress; GMFOTToken: HexAddress }>;

// Default addresses (mirrored from frontend/src/config/contracts.ts)
const DEFAULT_ADDRESSES: AddressMap = {
  // Lisk Sepolia (4202)
  4202: {
    VaultManager: "0x2a8066293B7673824209EA175dD157Dc6469E589",
    GMFOTToken: "0x26714a257257EEFb0bE06c9570aA314a3bB77393",
  },
  // Ethereum Sepolia (11155111)
  11155111: {
    VaultManager: "0xe19E99D644e56644CBd4428957996F9103b7C240",
    GMFOTToken: "0x614baD46b1CE22D30e2487DEC7ac4066bD485F5D",
  },
};

function isHexAddress(s?: string): s is HexAddress {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

function resolveAddresses(chainId: number): { VaultManager: HexAddress; GMFOTToken: HexAddress } {
  // Allow environment variable overrides
  const vmEnv = process.env.VAULT_MANAGER_ADDRESS;
  const gmfotEnv = process.env.GMFOT_TOKEN_ADDRESS;

  if (isHexAddress(vmEnv) && isHexAddress(gmfotEnv)) {
    return { VaultManager: vmEnv, GMFOTToken: gmfotEnv };
  }

  const defaults = DEFAULT_ADDRESSES[chainId];
  if (!defaults) {
    throw new Error(
      `No default addresses configured for chainId=${chainId}. Provide VAULT_MANAGER_ADDRESS and GMFOT_TOKEN_ADDRESS env vars.`
    );
  }
  return defaults;
}

async function main() {
  const [signer] = await ethers.getSigners();
  const signerAddr = await signer.getAddress();
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  const { VaultManager, GMFOTToken } = resolveAddresses(chainId);

  console.log("=== Register GMFOT as Borrow Token ===");
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);
  console.log("Signer:", signerAddr);
  console.log("VaultManager:", VaultManager);
  console.log("GMFOTToken:", GMFOTToken);

  const vm = await ethers.getContractAt("VaultManager", VaultManager, signer);

  // Optional: verify ownership before attempting the call
  try {
    const owner: string = await vm.owner();
    if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
      console.error("Error: Signer is not the VaultManager owner.");
      console.error("Owner:", owner);
      console.error("Signer:", signerAddr);
      console.error("Switch to the owner account or use a private key with ownership privileges.");
      process.exit(1);
    }
  } catch (e) {
    console.warn("Warning: Unable to read owner(). Continuing, but the transaction may revert if signer is not owner.");
  }

  // Check current status
  const alreadyAccepted: boolean = await vm.acceptedBorrowTokens(GMFOTToken);
  if (alreadyAccepted) {
    console.log("GMFOT is already accepted as a borrow token. Nothing to do.");
    return;
  }

  console.log("Submitting addBorrowToken transaction...");
  const tx = await vm.addBorrowToken(GMFOTToken);
  console.log("Tx submitted:", tx.hash);
  const receipt = await tx.wait();
  console.log("Tx confirmed in block:", receipt?.blockNumber);

  // Verify
  const nowAccepted: boolean = await vm.acceptedBorrowTokens(GMFOTToken);
  if (!nowAccepted) {
    throw new Error("Post-check failed: acceptedBorrowTokens is still false after addBorrowToken.");
  }

  console.log("Success: GMFOT has been registered as an accepted borrow token on this network.");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});