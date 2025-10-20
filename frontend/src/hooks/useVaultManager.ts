import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { parseUnits, formatUnits, parseEther } from 'viem';
import { getContractAddresses } from '../config/contracts';
import { VaultManagerABI } from '../abis';

// Special address representing native ETH in the VaultManager contract
export const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

/**
 * Hook to get user's native ETH balance
 */
export function useNativeBalance() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useBalance({
    address: address,
  });

  return {
    balance: data?.value,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read user's collateral for a specific token
 */
export function useUserCollateral(token: `0x${string}`) {
  const { address, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'collateral',
    args: address && token ? [address, token] : undefined,
    query: {
      enabled: !!address && !!token && !!contractAddresses,
    },
  });

  return {
    collateral: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read user's debt for a specific token
 */
export function useUserDebt(token: `0x${string}`) {
  const { address, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'debt',
    args: address && token ? [address, token] : undefined,
    query: {
      enabled: !!address && !!token && !!contractAddresses,
    },
  });

  return {
    debt: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read user's health factor for specific collateral and debt tokens
 */
export function useHealthFactor(collateralToken: `0x${string}`, debtToken: `0x${string}`) {
  const { address, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'getHealthFactor',
    args: address && collateralToken && debtToken ? [address, collateralToken, debtToken] : undefined,
    query: {
      enabled: !!address && !!collateralToken && !!debtToken && !!contractAddresses,
    },
  });

  return {
    healthFactor: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to deposit native ETH as collateral
 */
export function useDepositETH() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const depositETH = async (amount: string) => {
    if (!contractAddresses?.VaultManager) {
      throw new Error('VaultManager contract address not found for current network');
    }

    const amountInWei = parseEther(amount);

    return writeContract({
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'depositETH',
      args: [],
      value: amountInWei,
    });
  };

  return {
    depositETH,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to deposit ERC20 collateral
 */
export function useDepositCollateral() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (tokenAddress: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contractAddresses?.VaultManager) {
      throw new Error('VaultManager contract address not found for current network');
    }

    const amountInWei = parseUnits(amount, decimals);

    return writeContract({
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'deposit',
      args: [tokenAddress, amountInWei],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to borrow tokens
 */
export function useBorrow() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const borrow = async (tokenAddress: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contractAddresses?.VaultManager) {
      throw new Error('VaultManager contract address not found for current network');
    }

    const amountInWei = parseUnits(amount, decimals);

    return writeContract({
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'borrow',
      args: [tokenAddress, amountInWei],
    });
  };

  return {
    borrow,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to repay debt
 */
export function useRepay() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const repay = async (tokenAddress: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contractAddresses?.VaultManager) {
      throw new Error('VaultManager contract address not found for current network');
    }

    const amountInWei = parseUnits(amount, decimals);

    return writeContract({
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'repay',
      args: [tokenAddress, amountInWei],
    });
  };

  return {
    repay,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw native ETH collateral
 */
export function useWithdrawETH() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdrawETH = async (amount: string) => {
    if (!contractAddresses?.VaultManager) {
      throw new Error('VaultManager contract address not found for current network');
    }

    const amountInWei = parseEther(amount);

    return writeContract({
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'withdrawETH',
      args: [amountInWei],
    });
  };

  return {
    withdrawETH,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw ERC20 collateral
 */
export function useWithdrawCollateral() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = async (tokenAddress: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!contractAddresses?.VaultManager) {
      throw new Error('VaultManager contract address not found for current network');
    }

    const amountInWei = parseUnits(amount, decimals);

    return writeContract({
      address: contractAddresses.VaultManager as `0x${string}`,
      abi: VaultManagerABI,
      functionName: 'withdraw',
      args: [tokenAddress, amountInWei],
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to get collateral value in USD
 */
export function useCollateralValue(tokenAddress?: `0x${string}`, amount?: bigint) {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, error } = useReadContract({
    address: contractAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'getCollateralValue',
    args: tokenAddress && amount ? [tokenAddress, amount] : undefined,
    query: {
      enabled: !!tokenAddress && !!amount && !!contractAddresses,
    },
  });

  return {
    value: data,
    isLoading,
    error,
  };
}

/**
 * Utility function to format vault data
 */
export function formatVaultData(vault: any) {
  if (!vault) return null;

  return {
    collateralAmount: vault.collateralAmount ? formatUnits(vault.collateralAmount, 18) : '0',
    debtAmount: vault.debtAmount ? formatUnits(vault.debtAmount, 18) : '0',
    collateralToken: vault.collateralToken,
    borrowToken: vault.borrowToken,
  };
}
