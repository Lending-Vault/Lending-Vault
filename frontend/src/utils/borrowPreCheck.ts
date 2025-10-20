// Utility functions to pre-check borrow conditions
import { readContract } from '@wagmi/core';
import { config } from '../config/wagmi';
import { getContractAddresses } from '../config/contracts';
import { VaultManagerABI } from '../abis';
import { formatUnits } from 'viem';
import { NATIVE_ETH } from '../hooks/useVaultManager';
import { redstonePriceFeed } from './redstonePriceFeed';

export interface BorrowPreCheckResult {
  canBorrow: boolean;
  errors: string[];
  warnings: string[];
  info: {
    collateralValue: string;
    maxBorrowAmount: string;
    availableLiquidity: string;
    currentDebt: string;
    ethPriceSource: 'onchain' | 'redstone' | 'none';
    ethPrice: string;
  };
}

/**
 * Performs pre-flight checks before attempting to borrow
 * @param amount Amount to borrow
 * @param collateralToken Address of collateral token
 * @param borrowToken Address of borrow token
 * @returns Result object with canBorrow flag and relevant information
 */
export async function performBorrowPreCheck(
  amount: string,
  collateralToken: `0x${string}`,
  borrowToken: `0x${string}`
): Promise<BorrowPreCheckResult> {
  const result: BorrowPreCheckResult = {
    canBorrow: true,
    errors: [],
    warnings: [],
    info: {
      collateralValue: '0',
      maxBorrowAmount: '0',
      availableLiquidity: '0',
      currentDebt: '0',
      ethPriceSource: 'none',
      ethPrice: '0',
    },
  };

  try {
    const contractAddresses = getContractAddresses(config.state.chainId);
    if (!contractAddresses?.VaultManager) {
      result.errors.push('VaultManager contract not found for current network');
      result.canBorrow = false;
      return result;
    }

    // Check if tokens are accepted
    try {
      const isCollateralAccepted = await readContract(config, {
        address: contractAddresses.VaultManager as `0x${string}`,
        abi: VaultManagerABI,
        functionName: 'acceptedCollateral',
        args: [collateralToken],
      });

      if (!isCollateralAccepted) {
        result.errors.push('Collateral token is not accepted');
        result.canBorrow = false;
      }
    } catch (error) {
      result.errors.push('Failed to check if collateral token is accepted');
      result.canBorrow = false;
    }

    try {
      const isBorrowTokenAccepted = await readContract(config, {
        address: contractAddresses.VaultManager as `0x${string}`,
        abi: VaultManagerABI,
        functionName: 'acceptedBorrowTokens',
        args: [borrowToken],
      });

      if (!isBorrowTokenAccepted) {
        result.errors.push('Borrow token is not accepted');
        result.canBorrow = false;
      }
    } catch (error) {
      result.errors.push('Failed to check if borrow token is accepted');
      result.canBorrow = false;
    }

    // Get user's address
    const address = config.state.connections.get(config.state.current)?.accounts?.[0];
    if (!address) {
      result.errors.push('Wallet not connected');
      result.canBorrow = false;
      return result;
    }

    // Check user's collateral and debt
    try {
      const [userCollateral, userDebt] = await Promise.all([
        readContract(config, {
          address: contractAddresses.VaultManager as `0x${string}`,
          abi: VaultManagerABI,
          functionName: 'collateral',
          args: [address, collateralToken],
        }),
        readContract(config, {
          address: contractAddresses.VaultManager as `0x${string}`,
          abi: VaultManagerABI,
          functionName: 'debt',
          args: [address, borrowToken],
        }),
      ]);

      result.info.currentDebt = formatUnits(userDebt as bigint, 18);

      // Try to get collateral value from contract first
      let collateralValue = 0n;
      let ethPrice = 0;
      let priceSource: 'onchain' | 'redstone' | 'none' = 'none';

      try {
        collateralValue = await readContract(config, {
          address: contractAddresses.VaultManager as `0x${string}`,
          abi: VaultManagerABI,
          functionName: 'getCollateralValue',
          args: [address, collateralToken],
        }) as bigint;

        if (collateralValue > 0n) {
          priceSource = 'onchain';
          // Extract approximate ETH price from collateral value
          ethPrice = Number(collateralValue) / Number(formatUnits(userCollateral as bigint, 18));
        }
      } catch (error) {
        console.warn('Failed to get collateral value from contract, trying RedStone:', error);
      }

      // If on-chain oracle failed, try RedStone as fallback
      if (collateralValue === 0n) {
        try {
          ethPrice = await redstonePriceFeed.getETHPrice();
          if (ethPrice && ethPrice > 0) {
            // Calculate collateral value using RedStone price
            const collateralAmount = Number(formatUnits(userCollateral as bigint, 18));
            collateralValue = BigInt(Math.floor(collateralAmount * ethPrice * 10**18));
            priceSource = 'redstone';
            result.warnings.push('Using RedStone price feed as fallback (on-chain oracle unavailable)');
          }
        } catch (error) {
          console.warn('Failed to get price from RedStone:', error);
        }
      }

      result.info.ethPriceSource = priceSource;
      result.info.ethPrice = ethPrice.toString();

      if (collateralValue === 0n) {
        result.errors.push('Unable to determine collateral value - both on-chain oracle and RedStone failed');
        result.canBorrow = false;
      } else {
        result.info.collateralValue = formatUnits(collateralValue, 18);

        // Calculate max borrow amount (50% LTV)
        const maxBorrow = (collateralValue * 5000n) / 10000n; // 50% LTV
        result.info.maxBorrowAmount = formatUnits(maxBorrow, 18);

        // Check if borrow amount exceeds limit
        const borrowAmountWei = BigInt(parseFloat(amount) * 10**18);
        if (borrowAmountWei > maxBorrow) {
          result.errors.push(
            `Borrow amount exceeds limit. Max: ${result.info.maxBorrowAmount}, Requested: ${amount}`
          );
          result.canBorrow = false;
        }
      }
    } catch (error) {
      result.errors.push('Failed to fetch user position data');
      result.canBorrow = false;
    }

    // Check available liquidity
    try {
      // Get GMFOT balance of VaultManager
      const liquidity = await readContract(config, {
        address: borrowToken,
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

      result.info.availableLiquidity = formatUnits(liquidity as bigint, 18);

      // Check if requested amount exceeds available liquidity
      const borrowAmountWei = BigInt(parseFloat(amount) * 10**18);
      if (borrowAmountWei > (liquidity as bigint)) {
        result.errors.push(
          `Insufficient liquidity. Available: ${result.info.availableLiquidity}, Requested: ${amount}`
        );
        result.canBorrow = false;
      }
    } catch (error) {
      result.warnings.push('Failed to check available liquidity');
    }

    // Check health factor
    try {
      const healthFactor = await readContract(config, {
        address: contractAddresses.VaultManager as `0x${string}`,
        abi: VaultManagerABI,
        functionName: 'getHealthFactor',
        args: [address, collateralToken, borrowToken],
      });

      const hfValue = Number(formatUnits(healthFactor as bigint, 18));
      if (hfValue < 150) {
        result.warnings.push(`Health factor is low (${hfValue.toFixed(2)}%). Consider depositing more collateral.`);
      }
    } catch (error) {
      result.warnings.push('Failed to check health factor');
    }

    return result;
  } catch (error) {
    result.errors.push(`Unexpected error: ${error}`);
    result.canBorrow = false;
    return result;
  }
}

/**
 * Formats the pre-check result into a user-friendly message
 */
export function formatPreCheckMessage(result: BorrowPreCheckResult): string {
  if (!result.canBorrow) {
    return `Cannot borrow:\n${result.errors.join('\n')}`;
  }

  let message = 'Ready to borrow!\n\n';
  message += `Collateral Value: $${result.info.collateralValue}\n`;
  message += `Max Borrow Amount: ${result.info.maxBorrowAmount}\n`;
  message += `Available Liquidity: ${result.info.availableLiquidity}\n`;
  message += `Current Debt: ${result.info.currentDebt}\n`;
  
  // Add price source information
  if (result.info.ethPriceSource === 'onchain') {
    message += `ETH Price: $${result.info.ethPrice} (on-chain oracle)\n`;
  } else if (result.info.ethPriceSource === 'redstone') {
    message += `ETH Price: $${result.info.ethPrice} (RedStone API - fallback)\n`;
  } else {
    message += `ETH Price: Unavailable\n`;
  }

  if (result.warnings.length > 0) {
    message += `\n\nWarnings:\n${result.warnings.join('\n')}`;
  }

  return message;
}