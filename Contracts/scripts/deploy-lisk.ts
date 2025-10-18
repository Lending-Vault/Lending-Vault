import { ethers } from "hardhat";
import { writeFileSync } from "fs";

/**
 * Deployment script for Lisk network using RedStone Oracle
 */
async function main() {
  console.log(" Deploying LiquidVault to Lisk...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address))
  );

  // 1. Deploy RedStone Oracle
  console.log("\n Deploying RedStone Oracle...");
  const RedStoneOracle = await ethers.getContractFactory("RedStoneOracle");
  const redstoneOracle = await RedStoneOracle.deploy();
  await redstoneOracle.waitForDeployment();
  const redstoneAddress = await redstoneOracle.getAddress();
  console.log("RedStone Oracle deployed to:", redstoneAddress);

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

  // 7. Deploy Mock Tokens for testing
  console.log("\n Deploying Mock Tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const weth = await MockERC20.deploy("Wrapped ETH", "WETH");
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("Mock WETH deployed to:", wethAddress);

  const usdt = await MockERC20.deploy("Tether USD", "USDT");
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("Mock USDT deployed to:", usdtAddress);

  const usdc = await MockERC20.deploy("USD Coin", "USDC");
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // 8. Configure Oracle Manager
  console.log("\n Configuring Oracle Manager...");
  await oracleManager.setPrimaryOracle(redstoneAddress);
  await oracleManager.setManualOracle(manualAddress);
  console.log("Oracle Manager configured with RedStone as primary");

  // Define NATIVE_ETH address (used throughout deployment)
  const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  // 9. Configure RedStone Oracle (example data feed IDs)
  console.log("\n Configuring RedStone Oracle...");
  // These are example RedStone data feed IDs - replace with actual ones
  const ethDataFeedId = ethers.keccak256(ethers.toUtf8Bytes("ETH"));
  const usdtDataFeedId = ethers.keccak256(ethers.toUtf8Bytes("USDT"));
  const usdcDataFeedId = ethers.keccak256(ethers.toUtf8Bytes("USDC"));

  // Add data feed for NATIVE_ETH (Lisk Sepolia ETH)
  await redstoneOracle.addTokenDataFeed(NATIVE_ETH, ethDataFeedId);

  await redstoneOracle.addTokenDataFeed(wethAddress, ethDataFeedId);
  await redstoneOracle.addTokenDataFeed(usdtAddress, usdtDataFeedId);
  await redstoneOracle.addTokenDataFeed(usdcAddress, usdcDataFeedId);
  console.log("RedStone data feeds configured");

  // 10. Set initial prices in manual oracle (fallback)
  console.log("\n Setting initial prices...");

  // IMPORTANT: Set price for NATIVE_ETH (used for Sepolia ETH collateral)
  await manualOracle.emergencySetPrice(NATIVE_ETH, ethers.parseEther("2000")); // $2000

  await manualOracle.emergencySetPrice(wethAddress, ethers.parseEther("2000")); // $2000
  await manualOracle.emergencySetPrice(usdtAddress, ethers.parseEther("1")); // $1
  await manualOracle.emergencySetPrice(usdcAddress, ethers.parseEther("1")); // $1
  await manualOracle.emergencySetPrice(gftAddress, ethers.parseEther("1")); // $1 - GMFOT price
  console.log("Initial prices set in manual oracle");

  // 11. Configure VaultManager
  console.log("\n⚙️ Configuring VaultManager...");

  // CRITICAL: Add NATIVE_ETH as primary collateral (for native Lisk Sepolia ETH)
  await vaultManager.addCollateral(NATIVE_ETH);
  console.log("✅ Native ETH added as collateral:", NATIVE_ETH);

  // Add mock WETH as alternative collateral (for testing)
  await vaultManager.addCollateral(wethAddress);
  console.log("✅ Mock WETH added as collateral:", wethAddress);

  // Add borrow tokens
  await vaultManager.addBorrowToken(gftAddress); // GMFOT token
  await vaultManager.addBorrowToken(usdtAddress);
  await vaultManager.addBorrowToken(usdcAddress);
  console.log("✅ VaultManager configured with collateral and borrow tokens");

  // 12. Configure Savings Vault
  console.log("\n💰 Configuring Savings Vault...");
  await gftToken.authorizeMinter(savingsAddress);
  await savingsVault.addStablecoin(usdtAddress);
  await savingsVault.addStablecoin(usdcAddress);
  console.log("Savings Vault configured with stablecoins and GFT minting");

  // 13. Mint initial liquidity
  console.log("\n Minting initial liquidity...");
  await usdt.mint(vaultAddress, ethers.parseEther("1000000")); // 1M USDT liquidity
  await usdc.mint(vaultAddress, ethers.parseEther("1000000")); // 1M USDC liquidity
  await usdt.mint(deployer.address, ethers.parseEther("100000")); // Treasury funds for interest
  await usdc.mint(deployer.address, ethers.parseEther("100000")); // Treasury funds for interest
  console.log("Initial liquidity minted to vault and treasury");

  // 14. Save deployment info
  const deployment = {
    network: "lisk",
    chainId: await deployer.provider.getNetwork().then((n) => n.chainId),
    deployer: deployer.address,
    contracts: {
      redstoneOracle: redstoneAddress,
      manualOracle: manualAddress,
      oracleManager: oracleManagerAddress,
      vaultManager: vaultAddress,
      gftToken: gftAddress,
      savingsVault: savingsAddress,
      weth: wethAddress,
      usdt: usdtAddress,
      usdc: usdcAddress,
    },
    timestamp: new Date().toISOString(),
  };

  writeFileSync("deployment-lisk.json", JSON.stringify(deployment, null, 2));
  console.log(
    "\n Deployment completed! Configuration saved to deployment-lisk.json"
  );

  console.log("\n Summary:");
  console.log("- RedStone Oracle (Primary):", redstoneAddress);
  console.log("- Manual Oracle (Fallback):", manualAddress);
  console.log("- Oracle Manager:", oracleManagerAddress);
  console.log("- VaultManager:", vaultAddress);
  console.log("- GMFOT Token:", gftAddress);
  console.log("- Savings Vault:", savingsAddress);
  console.log("- Mock WETH:", wethAddress);
  console.log("- Mock USDT:", usdtAddress);
  console.log("- Mock USDC:", usdcAddress);

  console.log("\n Next Steps:");
  console.log("1. Configure RedStone relayers to update prices");
  console.log("2. Test the lending and savings functionality");
  console.log("3. Set up monitoring for price feeds");
  console.log("4. Test GFT token rewards distribution");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
