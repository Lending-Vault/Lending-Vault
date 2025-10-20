// Hook to fetch vault data from multiple networks simultaneously
import { useAccount, useReadContract } from 'wagmi';
import { useCallback } from 'react';
import { formatUnits } from 'viem';
import { getContractAddresses } from '../config/contracts';
import { VaultManagerABI } from '../abis';
import { liskSepolia } from 'wagmi/chains';
import { sepolia } from 'wagmi/chains';

// NATIVE_ETH constant address
const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as `0x${string}`;

export interface NetworkVaultData {
  chainId: number;
  chainName: string;
  collateral: string;
  debt: string;
  healthFactor: string;
  isLoading: boolean;
  error: Error | null;
}

export function useMultiNetworkVault() {
  const { address } = useAccount();

  // Get contract addresses for both networks
  const liskAddresses = getContractAddresses(liskSepolia.id);
  const ethereumAddresses = getContractAddresses(sepolia.id);

  // Fetch Lisk Sepolia collateral
  const {
    data: liskCollateral,
    isLoading: liskCollateralLoading,
    error: liskCollateralError,
    refetch: refetchLiskCollateral,
  } = useReadContract({
    address: liskAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'collateral',
    args: address ? [address, NATIVE_ETH] : undefined,
    chainId: liskSepolia.id,
  });

  // Fetch Lisk Sepolia debt
  const {
    data: liskDebt,
    isLoading: liskDebtLoading,
    error: liskDebtError,
    refetch: refetchLiskDebt,
  } = useReadContract({
    address: liskAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'debt',
    args: address && liskAddresses?.GMFOTToken ? [address, liskAddresses.GMFOTToken as `0x${string}`] : undefined,
    chainId: liskSepolia.id,
  });

  // Fetch Lisk Sepolia health factor
  const {
    data: liskHealth,
    isLoading: liskHealthLoading,
    error: liskHealthError,
    refetch: refetchLiskHealth,
  } = useReadContract({
    address: liskAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'getHealthFactor',
    args: address && liskAddresses?.GMFOTToken ? [address, NATIVE_ETH, liskAddresses.GMFOTToken as `0x${string}`] : undefined,
    chainId: liskSepolia.id,
  });

  // Fetch Ethereum Sepolia collateral
  const {
    data: ethCollateral,
    isLoading: ethCollateralLoading,
    error: ethCollateralError,
    refetch: refetchEthCollateral,
  } = useReadContract({
    address: ethereumAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'collateral',
    args: address ? [address, NATIVE_ETH] : undefined,
    chainId: sepolia.id,
  });

  // Fetch Ethereum Sepolia debt
  const {
    data: ethDebt,
    isLoading: ethDebtLoading,
    error: ethDebtError,
    refetch: refetchEthDebt,
  } = useReadContract({
    address: ethereumAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'debt',
    args: address && ethereumAddresses?.GMFOTToken ? [address, ethereumAddresses.GMFOTToken as `0x${string}`] : undefined,
    chainId: sepolia.id,
  });

  // Fetch Ethereum Sepolia health factor
  const {
    data: ethHealth,
    isLoading: ethHealthLoading,
    error: ethHealthError,
    refetch: refetchEthHealth,
  } = useReadContract({
    address: ethereumAddresses?.VaultManager as `0x${string}` | undefined,
    abi: VaultManagerABI,
    functionName: 'getHealthFactor',
    args: address && ethereumAddresses?.GMFOTToken ? [address, NATIVE_ETH, ethereumAddresses.GMFOTToken as `0x${string}`] : undefined,
    chainId: sepolia.id,
  });

  // Helper to format health factor from basis points (10000 = 100%)
  const formatHealthFactorFromBasisPoints = (hf: bigint | undefined): string => {
    if (!hf) return '0';

    // Check if it's max uint256 (no debt case)
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    if (hf >= maxUint256 / BigInt(1000)) {
      return '999'; // Return very high number to indicate infinite health
    }

    // Convert from basis points to decimal ratio
    // Example: 20000 basis points = 2.0 (200%)
    return (Number(hf) / 10000).toString();
  };

  // Format Lisk data
  const liskData: NetworkVaultData = {
    chainId: liskSepolia.id,
    chainName: 'Lisk Sepolia',
    collateral: liskCollateral ? formatUnits(liskCollateral as unknown as bigint, 18) : '0',
    debt: liskDebt ? formatUnits(liskDebt as unknown as bigint, 18) : '0',
    healthFactor: formatHealthFactorFromBasisPoints(liskHealth as unknown as bigint),
    isLoading: liskCollateralLoading || liskDebtLoading || liskHealthLoading,
    error: (liskCollateralError || liskDebtError || liskHealthError) as Error | null,
  };

  // Format Ethereum data
  const ethereumData: NetworkVaultData = {
    chainId: sepolia.id,
    chainName: 'Ethereum Sepolia',
    collateral: ethCollateral ? formatUnits(ethCollateral as unknown as bigint, 18) : '0',
    debt: ethDebt ? formatUnits(ethDebt as unknown as bigint, 18) : '0',
    healthFactor: formatHealthFactorFromBasisPoints(ethHealth as unknown as bigint),
    isLoading: ethCollateralLoading || ethDebtLoading || ethHealthLoading,
    error: (ethCollateralError || ethDebtError || ethHealthError) as Error | null,
  };

  // Refetch all data for a specific network (memoized)
  const refetchNetwork = useCallback((chainId: number) => {
    if (chainId === liskSepolia.id) {
      refetchLiskCollateral();
      refetchLiskDebt();
      refetchLiskHealth();
    } else if (chainId === sepolia.id) {
      refetchEthCollateral();
      refetchEthDebt();
      refetchEthHealth();
    }
  }, [refetchLiskCollateral, refetchLiskDebt, refetchLiskHealth, refetchEthCollateral, refetchEthDebt, refetchEthHealth]);

  // Refetch all networks (memoized to prevent infinite loops)
  const refetchAll = useCallback(() => {
    refetchLiskCollateral();
    refetchLiskDebt();
    refetchLiskHealth();
    refetchEthCollateral();
    refetchEthDebt();
    refetchEthHealth();
  }, [refetchLiskCollateral, refetchLiskDebt, refetchLiskHealth, refetchEthCollateral, refetchEthDebt, refetchEthHealth]);

  return {
    lisk: liskData,
    ethereum: ethereumData,
    refetchNetwork,
    refetchAll,
  };
}
