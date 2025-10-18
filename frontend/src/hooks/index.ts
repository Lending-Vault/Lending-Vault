// Vault Manager Hooks
export {
  useNativeBalance,
  useUserCollateral,
  useUserDebt,
  useHealthFactor,
  useDepositETH,
  useDepositCollateral,
  useBorrow,
  useRepay,
  useWithdrawETH,
  useWithdrawCollateral,
  useCollateralValue,
  formatVaultData,
  NATIVE_ETH,
} from './useVaultManager';

// Contract Address Hooks
export {
  useContractAddress,
  useContractAddresses,
} from './useContractAddress';

// ERC20 Token Hooks
export {
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useTokenInfo,
  formatTokenAmount,
  parseTokenAmount,
} from './useERC20';

// Oracle Hooks
export {
  useTokenPrice,
  useTokenPrices,
  formatPrice,
  calculateUsdValue,
} from './useOracle';

// Savings Vault Hooks
export {
  useUserSavingsPositions,
  useUserActivePositionsCount,
  useTotalValueLocked,
  useProtocolStats,
  useIsSupportedStablecoin,
  useMinimumDeposit,
  useEarlyWithdrawalPenalty,
  useGftRewards,
  useDepositSavings,
  useWithdrawSavings,
  formatSavingsPosition,
  getLockPeriodName,
  getLockPeriodDays,
  getDaysRemaining,
  LockPeriod,
  type SavingsPosition,
  type LockPeriodType,
} from './useSavingsVault';

// Transaction History Hooks
export {
  useTransactionHistory,
  getBlockExplorerUrl,
} from './useTransactionHistory';
