// src/hooks/useSavingsVault.ts
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getContractAddresses } from '../config/contracts';
import SavingsVaultABI from '../abis/SavingsVault.json';

// Lock period constants matching the contract
export const LockPeriod = {
  QUARTERLY: 0,    // 3 months
  SEMI_ANNUAL: 1,  // 6 months
  ANNUAL: 2        // 12 months
} as const;

export type LockPeriodType = typeof LockPeriod[keyof typeof LockPeriod];

// Savings position type
export interface SavingsPosition {
  positionId: bigint;
  stablecoin: string;
  principal: bigint;
  depositTime: bigint;
  lockEndTime: bigint;
  lockPeriod: LockPeriodType;
  withdrawn: boolean;
  stablecoinInterest: bigint;
  gftReward: bigint;
}

// Hook to get user's savings positions
export function useUserSavingsPositions() {
  const { address, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'getUserPositions',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddresses,
    },
  });

  return {
    positions: data as SavingsPosition[] | undefined,
    isLoading,
    refetch,
  };
}

// Hook to get user's active positions count
export function useUserActivePositionsCount() {
  const { address, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'getUserActivePositionsCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddresses,
    },
  });

  return {
    count: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

// Hook to get total value locked for a specific stablecoin
export function useTotalValueLocked(stablecoin: string) {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'getTotalValueLocked',
    args: [stablecoin as `0x${string}`],
    query: {
      enabled: !!contractAddresses,
    },
  });

  return {
    tvl: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

// Hook to get protocol stats
export function useProtocolStats() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'getProtocolStats',
    query: {
      enabled: !!contractAddresses,
    },
  });

  return {
    stats: data as { users: bigint; positions: bigint; activePositions: bigint } | undefined,
    isLoading,
    refetch,
  };
}

// Hook to check if a stablecoin is supported
export function useIsSupportedStablecoin(stablecoin: string) {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'supportedStablecoins',
    args: [stablecoin as `0x${string}`],
    query: {
      enabled: !!contractAddresses,
    },
  });

  return {
    isSupported: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

// Hook to get minimum deposit amount
export function useMinimumDeposit() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'minimumDeposit',
    query: {
      enabled: !!contractAddresses,
    },
  });

  return {
    minimumDeposit: data as bigint | undefined,
    isLoading,
  };
}

// Hook to get early withdrawal penalty
export function useEarlyWithdrawalPenalty() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'earlyWithdrawalPenalty',
    query: {
      enabled: !!contractAddresses,
    },
  });

  return {
    penalty: data as bigint | undefined,
    isLoading,
  };
}

// Hook to get GFT rewards for different lock periods
export function useGftRewards() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  const { data: quarterly } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'quarterlyGftReward',
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: semiAnnual } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'semiAnnualGftReward',
    query: {
      enabled: !!contractAddresses,
    },
  });

  const { data: annual } = useReadContract({
    address: contractAddresses?.SavingsVault as `0x${string}` | undefined,
    abi: SavingsVaultABI,
    functionName: 'annualGftReward',
    query: {
      enabled: !!contractAddresses,
    },
  });

  return {
    quarterly: quarterly as bigint | undefined,
    semiAnnual: semiAnnual as bigint | undefined,
    annual: annual as bigint | undefined,
  };
}

// Hook to deposit into savings vault
export function useDepositSavings() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (
    stablecoin: `0x${string}`,
    amount: string,
    decimals: number,
    lockPeriod: number
  ) => {
    if (!contractAddresses?.SavingsVault) {
      throw new Error('SavingsVault contract address not found for current network');
    }

    const amountInWei = parseUnits(amount, decimals);

    writeContract({
      address: contractAddresses.SavingsVault as `0x${string}`,
      abi: SavingsVaultABI,
      functionName: 'deposit',
      args: [stablecoin, amountInWei, lockPeriod],
    });
  };

  return {
    deposit,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    isError,
    error,
  };
}

// Hook to withdraw from savings vault
export function useWithdrawSavings() {
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = async (positionIndex: number) => {
    if (!contractAddresses?.SavingsVault) {
      throw new Error('SavingsVault contract address not found for current network');
    }

    writeContract({
      address: contractAddresses.SavingsVault as `0x${string}`,
      abi: SavingsVaultABI,
      functionName: 'withdraw',
      args: [BigInt(positionIndex)],
    });
  };

  return {
    withdraw,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    isError,
    error,
  };
}

// Utility function to format savings position data
export function formatSavingsPosition(position: SavingsPosition, decimals: number = 18) {
  return {
    positionId: position.positionId.toString(),
    stablecoin: position.stablecoin,
    principal: formatUnits(position.principal, decimals),
    depositTime: new Date(Number(position.depositTime) * 1000),
    lockEndTime: new Date(Number(position.lockEndTime) * 1000),
    lockPeriod: position.lockPeriod,
    withdrawn: position.withdrawn,
    stablecoinInterest: formatUnits(position.stablecoinInterest, decimals),
    gftReward: formatUnits(position.gftReward, 18), // GFT has 18 decimals
    isUnlocked: Date.now() > Number(position.lockEndTime) * 1000,
  };
}

// Utility function to get lock period name
export function getLockPeriodName(lockPeriod: number): string {
  switch (lockPeriod) {
    case 0:
      return 'Quarterly (3 months)';
    case 1:
      return 'Semi-Annual (6 months)';
    case 2:
      return 'Annual (12 months)';
    default:
      return 'Unknown';
  }
}

// Utility function to get lock period duration in days
export function getLockPeriodDays(lockPeriod: number): number {
  switch (lockPeriod) {
    case 0:
      return 90;
    case 1:
      return 180;
    case 2:
      return 365;
    default:
      return 0;
  }
}

// Utility function to calculate days remaining
export function getDaysRemaining(lockEndTime: bigint): number {
  const now = Math.floor(Date.now() / 1000);
  const endTime = Number(lockEndTime);
  const secondsRemaining = endTime - now;
  return Math.max(0, Math.ceil(secondsRemaining / (24 * 60 * 60)));
}
