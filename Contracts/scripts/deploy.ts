import { ethers, network } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("Deploying LiquidVault...");
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", network.name);

  // 1. Deploy PriceOracle
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("Oracle:", oracleAddress);

  // 2. Deploy Mock Tokens (testnet only)
  const isSepolia = network.name.includes("sepolia");
  let wethAddress: string;
  let usdtAddress: string;

  if (isSepolia) {
    const Token = await ethers.getContractFactory("MockERC20");

    const weth = await Token.deploy("Wrapped ETH", "WETH");
    await weth.waitForDeployment();
    wethAddress = await weth.getAddress();
    console.log("WETH:", wethAddress);

    const usdt = await Token.deploy("Tether USD", "USDT");
    await usdt.waitForDeployment();
    usdtAddress = await usdt.getAddress();
    console.log("USDT:", usdtAddress);
  } else {
    throw new Error(`Unsupported network for mock deployment: ${network.name}`);
  }

  // 3. Deploy VaultManager
  const Vault = await ethers.getContractFactory("VaultManager");
  const vault = await Vault.deploy(oracleAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault:", vaultAddress);

  // 4. Setup
  console.log("\nSetting up...");

  // Set prices
  const setWethPriceTx = await oracle.setPrice(wethAddress, ethers.parseEther("2000"));
  await setWethPriceTx.wait();
  const setUsdtPriceTx = await oracle.setPrice(usdtAddress, ethers.parseEther("1"));
  await setUsdtPriceTx.wait();
  console.log("Prices set");

  // Add WETH as collateral
  const addCollateralTx = await vault.addCollateral(wethAddress);
  await addCollateralTx.wait();
  console.log("WETH added as collateral");

  // Fund vault with 1M USDT
  const usdtContract = await ethers.getContractAt("MockERC20", usdtAddress);
  const fundTx = await usdtContract.transfer(vaultAddress, ethers.parseEther("1000000"));
  await fundTx.wait();
  console.log("Vault funded with 1M USDT");

  // 5. Save addresses
  const addresses = {
    network: network.name,
    oracle: oracleAddress,
    weth: wethAddress,
    usdt: usdtAddress,
    vault: vaultAddress,
  };

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log(JSON.stringify(addresses, null, 2));

  // Save to file
  fs.writeFileSync(
    `deployments-${network.name}.json`,
    JSON.stringify(addresses, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});