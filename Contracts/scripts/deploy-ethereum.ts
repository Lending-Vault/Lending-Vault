import { ethers } from "hardhat";
import { writeFileSync } from "fs";

/**
 * Deployment script for Ethereum Sepolia Testnet using Chainlink Oracle
 */
async function main() {
  console.log("🚀 Deploying LiquidVault to Ethereum Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Chainlink price feed addresses on Ethereum Sepolia testnet
  const CHAINLINK_ETH_USD = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // ETH/USD on Sepolia
  const CHAINLINK_USDT_USD = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"; // USDT/USD on Sepolia

  // 1. Deploy Chainlink Oracle
  console.log("\n Deploying Chainlink Oracle...");
  const ChainlinkOracle = await ethers.getContractFactory("ChainlinkOracle");
  const chainlinkOracle = await ChainlinkOracle.deploy();
  await chainlinkOracle.waitForDeployment();
  const chainlinkAddress = await chainlinkOracle.getAddress();
  console.log("Chainlink Oracle deployed to:", chainlinkAddress);

  // 2. Deploy Manual Oracle (fallback)
  console.log("\n Deploying Manual Oracle (fallback)...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const manualOracle = await PriceOracle.deploy();
  await manualOracle.waitForDeployment();
  const manualAddress = await manualOracle.getAddress();
  console.log("Manual Oracle deployed to:", manualAddress);

  // 3. Deploy Oracle Manager
  console.log("\n Deploying Oracle Manager...");
  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy();
  await oracleManager.waitForDeployment();
  const oracleManagerAddress = await oracleManager.getAddress();
  console.log("Oracle Manager deployed to:", oracleManagerAddress);

  // 4. Deploy VaultManager
  console.log("\n Deploying VaultManager...");
  const VaultManager = await ethers.getContractFactory("VaultManager");
  const vaultManager = await VaultManager.deploy(
    oracleManagerAddress,
    deployer.address
  );
  await vaultManager.waitForDeployment();
  const vaultAddress = await vaultManager.getAddress();
  console.log("VaultManager deployed to:", vaultAddress);

  // 5. Deploy GMFOT Token
  console.log("\n🪙 Deploying GMFOT Token...");
  const GMFOTToken = await ethers.getContractFactory("GMFOTToken");
  const gftToken = await GMFOTToken.deploy();
  await gftToken.waitForDeployment();
  const gftAddress = await gftToken.getAddress();
  console.log("GMFOT Token deployed to:", gftAddress);

  // 6. Deploy Savings Vault
  console.log("\n💰 Deploying Savings Vault...");
  const SavingsVault = await ethers.getContractFactory("SavingsVault");
  const savingsVault = await SavingsVault.deploy(gftAddress, deployer.address);
  await savingsVault.waitForDeployment();
  const savingsAddress = await savingsVault.getAddress();
  console.log("Savings Vault deployed to:", savingsAddress);

  // 7. Define token addresses
  const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // For native ETH collateral

  // Real token addresses on Ethereum Sepolia testnet
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // WETH on Sepolia
  const USDT_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"; // USDT on Sepolia
  const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // USDC on Sepolia

  console.log("\n📍 Token Addresses:");
  console.log("NATIVE_ETH (Primary Collateral):", NATIVE_ETH);
  console.log("WETH:", WETH_ADDRESS);
  console.log("USDT:", USDT_ADDRESS);
  console.log("USDC:", USDC_ADDRESS);

  // 6. Configure Oracle Manager
  console.log("\n Configuring Oracle Manager...");
  await oracleManager.setPrimaryOracle(chainlinkAddress);
  await oracleManager.setManualOracle(manualAddress);
  console.log("Oracle Manager configured with Chainlink as primary");

  // 7. Configure Chainlink Oracle
  console.log("\n Configuring Chainlink Oracle...");
  await chainlinkOracle.setAggregator(NATIVE_ETH, CHAINLINK_ETH_USD); // ETH price feed
  await chainlinkOracle.setAggregator(WETH_ADDRESS, CHAINLINK_ETH_USD);
  await chainlinkOracle.setAggregator(USDT_ADDRESS, CHAINLINK_USDT_USD);
  console.log("Chainlink aggregators configured");

  // 8. Set fallback prices in manual oracle
  console.log("\n Setting fallback prices...");
  await manualOracle.emergencySetPrice(NATIVE_ETH, ethers.parseEther("2000")); // $2000
  await manualOracle.emergencySetPrice(WETH_ADDRESS, ethers.parseEther("2000")); // $2000
  await manualOracle.emergencySetPrice(USDT_ADDRESS, ethers.parseEther("1")); // $1
  await manualOracle.emergencySetPrice(gftAddress, ethers.parseEther("1")); // $1 - GMFOT
  console.log("Fallback prices set in manual oracle");

  // 9. Configure VaultManager
  console.log("\n⚙️ Configuring VaultManager...");

  // CRITICAL: Add NATIVE_ETH as primary collateral (for native Ethereum Sepolia ETH)
  await vaultManager.addCollateral(NATIVE_ETH);
  console.log("✅ Native ETH added as collateral:", NATIVE_ETH);

  // Also add WETH as alternative collateral
  await vaultManager.addCollateral(WETH_ADDRESS);
  console.log("✅ WETH added as collateral:", WETH_ADDRESS);

  // Add borrow tokens
  await vaultManager.addBorrowToken(gftAddress); // GMFOT token
  await vaultManager.addBorrowToken(USDT_ADDRESS);
  console.log("✅ VaultManager configured with collateral and borrow tokens");

  // 10. Save deployment info
  const deployment = {
    network: "ethereum-sepolia",
    chainId: await deployer.provider.getNetwork().then((n) => n.chainId),
    deployer: deployer.address,
    contracts: {
      chainlinkOracle: chainlinkAddress,
      manualOracle: manualAddress,
      oracleManager: oracleManagerAddress,
      vaultManager: vaultAddress,
      gftToken: gftAddress,
      savingsVault: savingsAddress,
      nativeEth: NATIVE_ETH,
      weth: WETH_ADDRESS,
      usdt: USDT_ADDRESS,
      usdc: USDC_ADDRESS,
    },
    chainlinkFeeds: {
      ethUsd: CHAINLINK_ETH_USD,
      usdtUsd: CHAINLINK_USDT_USD,
    },
    timestamp: new Date().toISOString(),
  };

  writeFileSync(
    "deployment-ethereum-sepolia.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log(
    "\n✅ Deployment completed! Configuration saved to deployment-ethereum-sepolia.json"
  );

  console.log("\n📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network: Ethereum Sepolia Testnet");
  console.log("Deployer:", deployer.address);
  console.log("\n📦 Deployed Contracts:");
  console.log("  - Chainlink Oracle (Primary):", chainlinkAddress);
  console.log("  - Manual Oracle (Fallback):", manualAddress);
  console.log("  - Oracle Manager:", oracleManagerAddress);
  console.log("  - VaultManager:", vaultAddress);
  console.log("  - GMFOT Token:", gftAddress);
  console.log("  - Savings Vault:", savingsAddress);
  console.log("\n💰 Token Addresses:");
  console.log("  - NATIVE_ETH (Primary):", NATIVE_ETH);
  console.log("  - WETH:", WETH_ADDRESS);
  console.log("  - USDT:", USDT_ADDRESS);
  console.log("  - USDC:", USDC_ADDRESS);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n🎯 Next Steps:");
  console.log("1. Update frontend config with deployed addresses");
  console.log("2. Test native ETH deposits on Sepolia");
  console.log("3. Verify contracts on Etherscan Sepolia");
  console.log("4. Monitor Chainlink price feeds");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
