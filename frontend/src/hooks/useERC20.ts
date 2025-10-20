import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { IERC20ABI } from '../abis';

/**
 * Hook to read ERC20 token balance
 */
export function useTokenBalance(tokenAddress?: `0x${string}`) {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  return {
    balance: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read ERC20 token allowance
 */
export function useTokenAllowance(tokenAddress?: `0x${string}`, spenderAddress?: `0x${string}`) {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress,
    },
  });

  return {
    allowance: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to approve ERC20 token spending
 */
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    decimals: number = 18
  ) => {
    const amountInWei = parseUnits(amount, decimals);

    return writeContract({
      address: tokenAddress,
      abi: IERC20ABI,
      functionName: 'approve',
      args: [spenderAddress, amountInWei],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to read token metadata (name, symbol, decimals)
 */
export function useTokenInfo(tokenAddress?: `0x${string}`) {
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'name',
    query: {
      enabled: !!tokenAddress,
    },
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: IERC20ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    name,
    symbol,
    decimals,
  };
}

/**
 * Utility function to format token amount
 */
export function formatTokenAmount(amount: bigint | undefined, decimals: number = 18): string {
  if (!amount) return '0';
  return formatUnits(amount, decimals);
}

/**
 * Utility function to parse token amount
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}
