import { ethers, network } from "hardhat";
import * as fs from "fs";

type DeploymentRecord = {
  network: string;
  oracle: string;
  weth: string;
  usdt: string;
  vault: string;
};

function loadDeployment(): DeploymentRecord {
  try {
    const raw = fs.readFileSync(`deployments-${network.name}.json`, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Deployment file not found for network ${network.name}. Run deployment first.\nError: ${String(e)}`
    );
  }
}

const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

async function getPosition(userAddress?: string) {
  const [signer] = await ethers.getSigners();
  const user = userAddress || signer.address;
  const dep = loadDeployment();

  const vault = await ethers.getContractAt("VaultManager", dep.vault);

  const collateralRaw = await vault.collateral(user, dep.weth);
  const debtRaw = await vault.debt(user, dep.usdt);
  const collateralValue = await vault.getCollateralValue(user, dep.weth);
  const health: bigint = await vault.getHealthFactor(user, dep.weth, dep.usdt);

  console.log("=== Position ===");
  console.log("Network:", network.name);
  console.log("User:", user);
  console.log("Oracle:", dep.oracle);
  console.log("Vault:", dep.vault);
  console.log("WETH:", dep.weth);
  console.log("USDT:", dep.usdt);
  console.log("Collateral WETH (tokens):", ethers.formatUnits(collateralRaw, 18));
  console.log("Collateral Value (USD 1e18):", ethers.formatUnits(collateralValue, 18));
  console.log("Debt USDT (tokens):", ethers.formatUnits(debtRaw, 18));
  console.log("Health Factor (basis points):", health.toString());
  const percentInt = health / 100n;
  const percentFrac = health % 100n;
  console.log(`Health Factor (% approx): ${percentInt.toString()}.${percentFrac.toString().padStart(2, "0")}%`);
}

async function depositAndBorrow(amountEther: string) {
  const [signer] = await ethers.getSigners();
  const dep = loadDeployment();

  const vault = await ethers.getContractAt("VaultManager", dep.vault);
  const weth = new ethers.Contract(dep.weth, erc20Abi, signer);
  const usdt = new ethers.Contract(dep.usdt, erc20Abi, signer);

  const depositAmount = ethers.parseEther(amountEther);
  console.log("Approving WETH to Vault...");
  const tx1 = await weth.approve(dep.vault, depositAmount);
  await tx1.wait();
  console.log("Approved.");

  console.log(`Depositing ${amountEther} WETH...`);
  const tx2 = await vault.deposit(dep.weth, depositAmount);
  await tx2.wait();
  console.log("Deposit completed.");

  // Compute 40% of collateral value for borrowing in USDT (price = 1e18)
  const collateralValue: bigint = await vault.getCollateralValue(signer.address, dep.weth);
  const borrowAmount: bigint = (collateralValue * 4000n) / 10000n;
  if (borrowAmount === 0n) {
    console.log("Borrow amount computed as 0. Skipping borrow.");
    return;
  }

  console.log(`Borrowing USDT: ${ethers.formatUnits(borrowAmount, 18)} (40% of collateral value)...`);
  const tx3 = await vault.borrow(dep.weth, dep.usdt, borrowAmount);
  await tx3.wait();
  console.log("Borrow completed.");

  // Show final position
  await getPosition(signer.address);
}

async function repayAll() {
  const [signer] = await ethers.getSigners();
  const dep = loadDeployment();

  const vault = await ethers.getContractAt("VaultManager", dep.vault);
  const usdt = new ethers.Contract(dep.usdt, erc20Abi, signer);

  const currentDebt: bigint = await vault.debt(signer.address, dep.usdt);
  console.log("Current debt (USDT):", ethers.formatUnits(currentDebt, 18));
  if (currentDebt === 0n) {
    console.log("No debt to repay.");
    return;
  }

  console.log("Approving USDT to Vault for repayment...");
  const tx1 = await usdt.approve(dep.vault, currentDebt);
  await tx1.wait();
  console.log("Approved.");

  console.log("Repaying all debt...");
  const tx2 = await vault.repay(dep.usdt, currentDebt);
  await tx2.wait();
  console.log("Repay completed.");

  // Show final position
  await getPosition(signer.address);
}

async function updatePrice(token: string, newPriceHuman: string) {
  const dep = loadDeployment();
  const oracle = await ethers.getContractAt("PriceOracle", dep.oracle);
  const priceWei = ethers.parseEther(newPriceHuman);

  console.log(`Updating price for ${token} to ${newPriceHuman} (wei: ${priceWei.toString()})...`);
  const tx = await oracle.setPrice(token, priceWei);
  await tx.wait();
  console.log("Price updated.");
}

function usage() {
  console.log(`Usage:
  npx hardhat run scripts/interact.ts --network <network> position [userAddress]
  npx hardhat run scripts/interact.ts --network <network> deposit <amountWETH>
  npx hardhat run scripts/interact.ts --network <network> repay
  npx hardhat run scripts/interact.ts --network <network> update-price <tokenAddr> <newPriceHuman>
`);
}

async function main() {
  const action = process.argv[2];

  try {
    switch (action) {
      case "position":
        await getPosition(process.argv[3]);
        break;
      case "deposit":
        if (!process.argv[3]) {
          usage();
          throw new Error("Missing deposit amount (WETH)");
        }
        await depositAndBorrow(process.argv[3]);
        break;
      case "repay":
        await repayAll();
        break;
      case "update-price":
        if (!process.argv[3] || !process.argv[4]) {
          usage();
          throw new Error("Missing token address or newPrice");
        }
        await updatePrice(process.argv[3], process.argv[4]);
        break;
      default:
        usage();
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main();