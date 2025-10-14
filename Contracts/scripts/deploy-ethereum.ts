import { ethers } from "hardhat";
import { writeFileSync } from "fs";

/**
 * Deployment script for Ethereum network using Chainlink Oracle
 */
async function main() {
  console.log(" Deploying LiquidVault to Ethereum...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address))
  );

  // Chainlink price feed addresses on Ethereum mainnet
  const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
  const CHAINLINK_USDT_USD = "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";

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

  // 7. Use real token addresses on Ethereum mainnet
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const USDC_ADDRESS = "0xA0b86a33E6441b8C4C7C4b0b8C4C4C4C4C4C4C4C";

  console.log("Using real tokens:");
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
  await chainlinkOracle.setAggregator(WETH_ADDRESS, CHAINLINK_ETH_USD);
  await chainlinkOracle.setAggregator(USDT_ADDRESS, CHAINLINK_USDT_USD);
  console.log("Chainlink aggregators configured");

  // 8. Set fallback prices in manual oracle
  console.log("\n Setting fallback prices...");
  await manualOracle.emergencySetPrice(WETH_ADDRESS, ethers.parseEther("2000")); // $2000
  await manualOracle.emergencySetPrice(USDT_ADDRESS, ethers.parseEther("1")); // $1
  console.log("Fallback prices set in manual oracle");

  // 9. Configure VaultManager
  console.log("\n Configuring VaultManager...");
  await vaultManager.addCollateral(WETH_ADDRESS);
  await vaultManager.addBorrowToken(USDT_ADDRESS);
  console.log("VaultManager configured with real tokens");

  // 10. Save deployment info
  const deployment = {
    network: "ethereum",
    chainId: await deployer.provider.getNetwork().then((n) => n.chainId),
    deployer: deployer.address,
    contracts: {
      chainlinkOracle: chainlinkAddress,
      manualOracle: manualAddress,
      oracleManager: oracleManagerAddress,
      vaultManager: vaultAddress,
      weth: WETH_ADDRESS,
      usdt: USDT_ADDRESS,
    },
    chainlinkFeeds: {
      ethUsd: CHAINLINK_ETH_USD,
      usdtUsd: CHAINLINK_USDT_USD,
    },
    timestamp: new Date().toISOString(),
  };

  writeFileSync(
    "deployment-ethereum.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log(
    "\n Deployment completed! Configuration saved to deployment-ethereum.json"
  );

  console.log("\n Summary:");
  console.log("- Chainlink Oracle (Primary):", chainlinkAddress);
  console.log("- Manual Oracle (Fallback):", manualAddress);
  console.log("- Oracle Manager:", oracleManagerAddress);
  console.log("- VaultManager:", vaultAddress);
  console.log("- WETH:", WETH_ADDRESS);
  console.log("- USDT:", USDT_ADDRESS);

  console.log("\n Next Steps:");
  console.log("1. Fund the vault with USDT liquidity");
  console.log("2. Test the lending functionality");
  console.log("3. Monitor Chainlink price feeds");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
