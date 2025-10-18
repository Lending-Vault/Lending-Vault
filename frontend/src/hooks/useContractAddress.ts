import { useAccount } from 'wagmi';
import { getContractAddresses, type ContractName } from '../config/contracts';

/**
 * Hook to get contract address for the current network
 */
export function useContractAddress(contractName: ContractName): `0x${string}` | undefined {
  const { chainId } = useAccount();
  const addresses = getContractAddresses(chainId);

  if (!addresses) return undefined;

  return addresses[contractName] as `0x${string}`;
}

/**
 * Hook to get all contract addresses for the current network
 */
export function useContractAddresses() {
  const { chainId } = useAccount();
  return getContractAddresses(chainId);
}
