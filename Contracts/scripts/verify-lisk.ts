// scripts/verify-lisk.ts
// Verifies contracts deployed on Lisk Sepolia (Blockscout) using Hardhat Etherscan plugin with customChains

import fs from 'fs';
import path from 'path';
import { run, network } from 'hardhat';

type DeploymentLisk = {
  network: string;
  chainId: number | string;
  deployer: string;
  contracts: {
    redstoneOracle: string; // RedStoneOracle
    manualOracle: string;   // PriceOracle
    oracleManager: string;  // OracleManager
    vaultManager: string;   // VaultManager
    gftToken: string;       // GMFOTToken
    savingsVault: string;   // SavingsVault
    weth: string;           // MockERC20("Wrapped ETH","WETH")
    usdt: string;           // MockERC20("Tether USD","USDT")
    usdc: string;           // MockERC20("USD Coin","USDC")
  };
  timestamp?: string;
};

async function tryVerify(params: {
  address: string;
  constructorArguments: any[];
  contract?: string; // Fully qualified path e.g. "contracts/xyz.sol:ContractName"
  nameForLogs: string;
}) {
  const { address, constructorArguments, contract, nameForLogs } = params;
  try {
    console.log(`\n🔍 Verifying ${nameForLogs} at ${address} ...`);
    await run('verify:verify', {
      address,
      constructorArguments,
      contract,
    });
    console.log(`✅ Verified ${nameForLogs}`);
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.toLowerCase().includes('already verified')) {
      console.log(`ℹ️  ${nameForLogs} is already verified.`);
    } else {
      console.error(`❌ Failed to verify ${nameForLogs}:`, msg);
    }
  }
}

function loadDeployment(): DeploymentLisk {
  // Resolve file relative to Contracts/ directory regardless of CWD
  const file = path.resolve(__dirname, '..', 'deployment-lisk.json');
  if (!fs.existsSync(file)) {
    throw new Error(
      `deployment-lisk.json not found at ${file}. Run the deploy script or adjust the path.`
    );
  }
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as DeploymentLisk;
}

async function main() {
  if (network.name !== 'lisk-sepolia') {
    console.warn(
      `⚠️ Running on network "${network.name}". It's recommended to run with --network lisk-sepolia`
    );
  }

  const deployment = loadDeployment();

  const {
    redstoneOracle,
    manualOracle,
    oracleManager,
    vaultManager,
    gftToken,
    savingsVault,
    weth,
    usdt,
    usdc,
  } = deployment.contracts;

  const protocolTreasury = deployment.deployer;

  // Contracts and constructor args:
  // - RedStoneOracle(): no args
  // - PriceOracle(): no args
  // - OracleManager(): no args
  // - VaultManager(address _priceOracle, address _protocolTreasury) => (oracleManager, deployer)
  // - GMFOTToken(): no args
  // - SavingsVault(address _gftToken, address _protocolTreasury) => (gftToken, deployer)
  // - MockERC20(string name, string symbol) for weth/usdt/usdc:
  //     WETH  => ("Wrapped ETH", "WETH")
  //     USDT  => ("Tether USD", "USDT")
  //     USDC  => ("USD Coin", "USDC")

  // Verify RedStoneOracle
  await tryVerify({
    address: redstoneOracle,
    constructorArguments: [],
    contract: 'contracts/oracles/RedStoneOracle.sol:RedStoneOracle',
    nameForLogs: 'RedStoneOracle',
  });

  // Verify Manual PriceOracle
  await tryVerify({
    address: manualOracle,
    constructorArguments: [],
    contract: 'contracts/PriceOracle.sol:PriceOracle',
    nameForLogs: 'PriceOracle (Manual Fallback)',
  });

  // Verify OracleManager
  await tryVerify({
    address: oracleManager,
    constructorArguments: [],
    contract: 'contracts/oracles/OracleManager.sol:OracleManager',
    nameForLogs: 'OracleManager',
  });

  // Verify VaultManager
  await tryVerify({
    address: vaultManager,
    constructorArguments: [oracleManager, protocolTreasury],
    contract: 'contracts/VaultManager.sol:VaultManager',
    nameForLogs: 'VaultManager',
  });

  // Verify GMFOTToken
  await tryVerify({
    address: gftToken,
    constructorArguments: [],
    contract: 'contracts/tokens/GMFOTToken.sol:GMFOTToken',
    nameForLogs: 'GMFOTToken',
  });

  // Verify SavingsVault
  await tryVerify({
    address: savingsVault,
    constructorArguments: [gftToken, protocolTreasury],
    contract: 'contracts/SavingsVault.sol:SavingsVault',
    nameForLogs: 'SavingsVault',
  });

  // Verify Mock WETH
  await tryVerify({
    address: weth,
    constructorArguments: ['Wrapped ETH', 'WETH'],
    contract: 'contracts/mocks/MockERC20.sol:MockERC20',
    nameForLogs: 'MockERC20 (WETH)',
  });

  // Verify Mock USDT
  await tryVerify({
    address: usdt,
    constructorArguments: ['Tether USD', 'USDT'],
    contract: 'contracts/mocks/MockERC20.sol:MockERC20',
    nameForLogs: 'MockERC20 (USDT)',
  });

  // Verify Mock USDC
  await tryVerify({
    address: usdc,
    constructorArguments: ['USD Coin', 'USDC'],
    contract: 'contracts/mocks/MockERC20.sol:MockERC20',
    nameForLogs: 'MockERC20 (USDC)',
  });

  console.log('\n🎉 Verification flow complete for Lisk Sepolia.');
  console.log('If any contract failed, review the error logs above and re-run for that specific address.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });