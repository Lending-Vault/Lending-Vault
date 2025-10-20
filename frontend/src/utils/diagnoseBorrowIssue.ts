// Diagnostic utility to help identify borrow issues
import { readContract, getAccount } from '@wagmi/core';
import { config } from '../config/wagmi';
import { getContractAddresses } from '../config/contracts';
import { VaultManagerABI } from '../abis';
import { formatUnits } from 'viem';
import { NATIVE_ETH } from '../hooks/useVaultManager';
import { redstonePriceFeed } from './redstonePriceFeed';

export interface DiagnosticResult {
  issue: string;
  severity: 'error' | 'warning' | 'info';
  details: string;
  suggestedFix: string;
}

/**
 * Runs comprehensive diagnostics to identify borrow issues
 */
export async function diagnoseBorrowIssues(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const contractAddresses = getContractAddresses(getAccount(config).chainId);

  if (!contractAddresses?.VaultManager) {
    results.push({
      issue: 'VaultManager contract not found',
      severity: 'error',
      details: `No VaultManager contract found for chain ID: ${config.state.chainId}`,
      suggestedFix: 'Ensure you are connected to a supported network (Lisk Sepolia or Ethereum Sepolia)',
    });
    return results;
  }

  // Get user's address
  const account = getAccount(config);
  const address = account.address;
  if (!address) {
    results.push({
      issue: 'Wallet not connected',
      severity: 'error',
      details: 'No wallet connection detected',
      suggestedFix: 'Connect your wallet using the connect button',
    });
    return results;
  }
  const userAddress = address!;

  // Check 1: Token acceptance
  try {
    const [isETHAccepted, isGMFOTAccepted] = await Promise.all([
      readContract(config, {
        address: contractAddresses.VaultManager as `0x${string}`,
        abi: VaultManagerABI,
        functionName: 'acceptedCollateral',
        args: [NATIVE_ETH],
      }),
      readContract(config, {
        address: contractAddresses.VaultManager as `0x${string}`,
        abi: VaultManagerABI,
        functionName: 'acceptedBorrowTokens',
        args: [contractAddresses.GMFOTToken as `0x${string}`],
      }),
    ]);

    if (!isETHAccepted) {
      results.push({
        issue: 'ETH not accepted as collateral',
        severity: 'error',
        details: 'Native ETH is not configured as an accepted collateral token',
        suggestedFix: 'Contact the admin to add ETH as an accepted collateral token',
      });
    }

    if (!isGMFOTAccepted) {
      results.push({
        issue: 'GMFOT not accepted as borrow token',
        severity: 'error',
        details: 'GMFOT is not configured as an accepted borrow token',
        suggestedFix: 'Contact the admin to add GMFOT as an accepted borrow token',
      });
    }
  } catch (error) {
    results.push({
      issue: 'Failed to check token acceptance',
      severity: 'error',
      details: `Error: ${error}`,
      suggestedFix: 'Check your network connection and try again',
    });
  }

  // Check 2: User's collateral position
  try {
    const collateral = await readContract(config, {
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'collateral',
      args: [userAddress, NATIVE_ETH],
    });

    if (collateral as unknown as bigint === 0n) {
      results.push({
        issue: 'No collateral deposited',
        severity: 'error',
        details: 'You have not deposited any ETH as collateral',
        suggestedFix: 'Deposit ETH as collateral before attempting to borrow',
      });
    } else {
      results.push({
        issue: 'Collateral found',
        severity: 'info',
        details: `Collateral amount: ${formatUnits(collateral as unknown as bigint, 18)} ETH`,
        suggestedFix: '',
      });
    }
  } catch (error) {
    results.push({
      issue: 'Failed to check collateral',
      severity: 'error',
      details: `Error: ${error}`,
      suggestedFix: 'Check your network connection and try again',
    });
  }

  // Check 3: Oracle prices
  try {
    const priceOracleResult = await readContract(config, {
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'priceOracle',
      args: [],
    });
    const priceOracle = priceOracleResult as unknown as `0x${string}`;

    results.push({
      issue: 'Price oracle found',
      severity: 'info',
      details: `Price oracle address: ${priceOracle}`,
      suggestedFix: '',
    });

    // Try to get ETH price
    try {
      const ethPriceResult = await readContract(config, {
        address: priceOracle,
        abi: [
          {
            name: 'getPrice',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'token', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'getPrice',
        args: [NATIVE_ETH],
      });
      const ethPrice = ethPriceResult as unknown as bigint;

      if (ethPrice === 0n) {
        results.push({
          issue: 'ETH price is zero',
          severity: 'error',
          details: 'The oracle is returning a price of 0 for ETH',
          suggestedFix: 'The oracle needs to be configured with a valid price for ETH',
        });
      } else {
        results.push({
          issue: 'ETH price retrieved',
          severity: 'info',
          details: `ETH price: ${formatUnits(ethPrice, 8)} USD`,
          suggestedFix: '',
        });
      }
    } catch (error) {
      results.push({
        issue: 'Failed to get ETH price from oracle',
        severity: 'error',
        details: `Error: ${error}`,
        suggestedFix: 'The oracle might be misconfigured or not responding',
      });
    }
  } catch (error) {
    results.push({
      issue: 'Failed to get price oracle address',
      severity: 'error',
      details: `Error: ${error}`,
      suggestedFix: 'The VaultManager might not be properly configured',
    });
  }

  // Check 3.5: RedStone price feed as fallback
  try {
    const redstoneEthPrice = await redstonePriceFeed.getETHPrice();
    if (redstoneEthPrice && redstoneEthPrice > 0) {
      results.push({
        issue: 'RedStone price feed available',
        severity: 'info',
        details: `RedStone ETH price: $${redstoneEthPrice.toFixed(2)} USD`,
        suggestedFix: 'This can be used as a fallback if the on-chain oracle fails',
      });
    } else {
      results.push({
        issue: 'RedStone price feed unavailable',
        severity: 'warning',
        details: 'Could not fetch price from RedStone API',
        suggestedFix: 'Check internet connection or RedStone API status',
      });
    }
  } catch (error) {
    results.push({
      issue: 'Failed to fetch RedStone prices',
      severity: 'warning',
      details: `Error: ${error}`,
      suggestedFix: 'RedStone API might be temporarily unavailable',
    });
  }

  // Check 4: GMFOT liquidity
  try {
    const liquidityResult = await readContract(config, {
      address: contractAddresses.GMFOTToken as `0x${string}`,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [contractAddresses.VaultManager as `0x${string}`],
    });
    const liquidity = liquidityResult as unknown as bigint;

    if (liquidity === 0n) {
      results.push({
        issue: 'No GMFOT liquidity in VaultManager',
        severity: 'error',
        details: 'The VaultManager has no GMFOT tokens available to lend',
        suggestedFix: 'Transfer GMFOT tokens to the VaultManager address to provide liquidity',
      });
    } else {
      results.push({
        issue: 'GMFOT liquidity available',
        severity: 'info',
        details: `Available liquidity: ${formatUnits(liquidity, 18)} GMFOT`,
        suggestedFix: '',
      });
    }
  } catch (error) {
    results.push({
      issue: 'Failed to check GMFOT liquidity',
      severity: 'warning',
      details: `Error: ${error}`,
      suggestedFix: 'Make sure the GMFOT token address is correct',
    });
  }

  // Check 5: Health factor
  try {
    const healthFactorResult = await readContract(config, {
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'getHealthFactor',
      args: [userAddress, NATIVE_ETH, contractAddresses.GMFOTToken as `0x${string}`],
    });

    const hfValue = Number(formatUnits(healthFactorResult as unknown as bigint, 18));
    if (hfValue < 150) {
      results.push({
        issue: 'Health factor too low',
        severity: 'error',
        details: `Current health factor: ${hfValue.toFixed(2)}% (minimum: 150%)`,
        suggestedFix: 'Deposit more collateral to increase your health factor',
      });
    } else if (hfValue < 200) {
      results.push({
        issue: 'Health factor low',
        severity: 'warning',
        details: `Current health factor: ${hfValue.toFixed(2)}% (recommended: 200%+)`,
        suggestedFix: 'Consider depositing more collateral for a safer position',
      });
    } else {
      results.push({
        issue: 'Health factor healthy',
        severity: 'info',
        details: `Current health factor: ${hfValue.toFixed(2)}%`,
        suggestedFix: '',
      });
    }
  } catch (error) {
    results.push({
      issue: 'Failed to check health factor',
      severity: 'warning',
      details: `Error: ${error}`,
      suggestedFix: 'This might be due to oracle issues or having no debt position',
    });
  }

  return results;
}

/**
 * Formats diagnostic results into a user-friendly report
 */
export function formatDiagnosticReport(results: DiagnosticResult[]): string {
  let report = 'Borrow Diagnostic Report\n';
  report += '========================\n\n';

  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const info = results.filter(r => r.severity === 'info');

  if (errors.length > 0) {
    report += 'ERRORS (must be fixed):\n';
    report += '-------------------------\n';
    errors.forEach((result, index) => {
      report += `${index + 1}. ${result.issue}\n`;
      report += `   Details: ${result.details}\n`;
      report += `   Fix: ${result.suggestedFix}\n\n`;
    });
  }

  if (warnings.length > 0) {
    report += 'WARNINGS (should be addressed):\n';
    report += '------------------------------\n';
    warnings.forEach((result, index) => {
      report += `${index + 1}. ${result.issue}\n`;
      report += `   Details: ${result.details}\n`;
      report += `   Fix: ${result.suggestedFix}\n\n`;
    });
  }

  if (info.length > 0) {
    report += 'INFO:\n';
    report += '-----\n';
    info.forEach((result, index) => {
      report += `${index + 1}. ${result.issue}\n`;
      report += `   Details: ${result.details}\n`;
      if (result.suggestedFix) {
        report += `   Note: ${result.suggestedFix}\n`;
      }
      report += '\n';
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    report += '✅ No issues found! You should be able to borrow.\n';
  }

  return report;
}