// scripts/verify-ethereum.ts
// Verifies contracts deployed on Ethereum Sepolia using Hardhat Etherscan plugin

import fs from 'fs';
import path from 'path';
import { run, network } from 'hardhat';

type DeploymentEthereum = {
  network: string;
  chainId: number | string;
  deployer: string;
  contracts: {
    chainlinkOracle: string;
    manualOracle: string; // PriceOracle
    oracleManager: string;
    vaultManager: string;
    gftToken: string;     // GMFOTToken
    savingsVault: string;
    nativeEth?: string;   // NATIVE_ETH placeholder (not verified)
    weth?: string;        // External token, not verified here
    usdt?: string;        // External token, not verified here
    usdc?: string;        // External token, not verified here
  };
  chainlinkFeeds?: {
    ethUsd?: string;
    usdtUsd?: string;
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

function loadDeployment(): DeploymentEthereum {
  // Resolve file relative to Contracts/ directory regardless of CWD
  const file = path.resolve(__dirname, '..', 'deployment-ethereum-sepolia.json');
  if (!fs.existsSync(file)) {
    throw new Error(
      `deployment-ethereum-sepolia.json not found at ${file}. Run the deploy script or adjust the path.`
    );
  }
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as DeploymentEthereum;
}

async function main() {
  if (network.name !== 'ethereum-sepolia') {
    console.warn(
      `⚠️ Running on network "${network.name}". It's recommended to run with --network ethereum-sepolia`
    );
  }

  const deployment = loadDeployment();

  const {
    chainlinkOracle,
    manualOracle,
    oracleManager,
    vaultManager,
    gftToken,
    savingsVault,
  } = deployment.contracts;

  const protocolTreasury = deployment.deployer;

  // Contracts and constructor args:
  // - ChainlinkOracle(): no args
  // - PriceOracle(): no args
  // - OracleManager(): no args
  // - VaultManager(address _priceOracle, address _protocolTreasury)
  //     In this project _priceOracle is the OracleManager proxy that exposes getPrice()
  // - GMFOTToken(): no args
  // - SavingsVault(address _gftToken, address _protocolTreasury)

  // Verify ChainlinkOracle
  await tryVerify({
    address: chainlinkOracle,
    constructorArguments: [],
    contract: 'contracts/oracles/ChainlinkOracle.sol:ChainlinkOracle',
    nameForLogs: 'ChainlinkOracle',
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

  console.log('\n🎉 Verification flow complete for Ethereum Sepolia.');
  console.log('If any contract failed, review the error logs above and re-run for that specific address.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });