import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { getContractAddresses } from '../config/contracts';
import { OracleManagerABI } from '../abis';

/**
 * Hook to get token price from Oracle
 */
export function useTokenPrice(tokenAddress?: `0x${string}`) {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddresses?.OracleManager as `0x${string}` | undefined,
    abi: OracleManagerABI,
    functionName: 'getPrice',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!contractAddresses,
    },
  });

  return {
    price: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get multiple token prices
 * @param tokenAddresses Array of token addresses to fetch prices for
 * @returns Array of price query results
 */
export function useTokenPrices(tokenAddresses: `0x${string}`[]) {
  // This is a simplified version that uses individual calls
  // In production, consider using useReadContracts for batch reading
  return tokenAddresses.map((tokenAddress) => useTokenPrice(tokenAddress));
}

/**
 * Utility function to format price (assuming 8 decimals for USD prices)
 */
export function formatPrice(price: bigint | undefined, decimals: number = 8): string {
  if (!price) return '0';
  return formatUnits(price, decimals);
}

/**
 * Utility function to calculate USD value
 */
export function calculateUsdValue(
  amount: bigint | undefined,
  price: bigint | undefined,
  tokenDecimals: number = 18,
  priceDecimals: number = 8
): string {
  if (!amount || !price) return '0';

  // Convert to numbers for calculation
  const amountNum = parseFloat(formatUnits(amount, tokenDecimals));
  const priceNum = parseFloat(formatUnits(price, priceDecimals));

  return (amountNum * priceNum).toFixed(2);
}
