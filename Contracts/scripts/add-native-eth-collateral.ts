// Script to add NATIVE_ETH as accepted collateral
// Run this if deposit transactions are failing with TokenNotAccepted error

import { ethers } from "hardhat";

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  console.log("Adding NATIVE_ETH as accepted collateral...");

  // Get deployment addresses
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  let vaultManagerAddress: string;

  if (network.chainId === 4202n) {
    // Lisk Sepolia
    vaultManagerAddress = "0x2a8066293B7673824209EA175dD157Dc6469E589";
    console.log("Using Lisk Sepolia VaultManager:", vaultManagerAddress);
  } else if (network.chainId === 11155111n) {
    // Ethereum Sepolia
    vaultManagerAddress = "0xe19E99D644e56644CBd4428957996F9103b7C240";
    console.log("Using Ethereum Sepolia VaultManager:", vaultManagerAddress);
  } else {
    throw new Error(`Unsupported network: ${network.chainId}`);
  }

  // Get VaultManager contract
  const VaultManager = await ethers.getContractFactory("VaultManager");
  const vaultManager = VaultManager.attach(vaultManagerAddress);

  // Check if NATIVE_ETH is already accepted
  console.log("\nChecking current status...");
  const isAccepted = await vaultManager.acceptedCollateral(NATIVE_ETH);
  console.log("NATIVE_ETH accepted:", isAccepted);

  if (isAccepted) {
    console.log("✅ NATIVE_ETH is already accepted as collateral!");
    return;
  }

  // Add NATIVE_ETH as accepted collateral
  console.log("\n🔄 Adding NATIVE_ETH as accepted collateral...");
  const tx = await vaultManager.addCollateral(NATIVE_ETH);
  console.log("Transaction sent:", tx.hash);

  console.log("⏳ Waiting for confirmation...");
  await tx.wait();

  console.log("✅ NATIVE_ETH added successfully!");

  // Verify it was added
  const isAcceptedAfter = await vaultManager.acceptedCollateral(NATIVE_ETH);
  console.log("Verification - NATIVE_ETH accepted:", isAcceptedAfter);

  console.log("\n✅ Done! You can now deposit native ETH.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
