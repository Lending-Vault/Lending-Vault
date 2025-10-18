// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  // Lisk Sepolia (Chain ID: 4202)
  4202: {
    VaultManager: '0x2a8066293B7673824209EA175dD157Dc6469E589',
    GMFOTToken: '0x26714a257257EEFb0bE06c9570aA314a3bB77393',
    SavingsVault: '0x54674c5D538Ab51df284EC9B55C04A59204b4f26',
    OracleManager: '0x54b1F91bcD7E8377Ea1ad55829b2Fb1F6E281524',
    RedStoneOracle: '0xdc78058bE1d9F28003584a972ac09fC3c4Ed67DD',
    ManualOracle: '0xba57C7Cc575D701612883E92B26c2a219cD83146',
    MockWETH: '0x0E390Cd137377f34bf178153d2eCBc8369e7586D',
    MockUSDT: '0x0cFCB172D65f2b40e0457386B57b606425b8b718',
    MockUSDC: '0xE3A66240BB1F1511071592e04c1Aa0C70Ac294EE',
  },
  // Ethereum Sepolia (Chain ID: 11155111)
  11155111: {
    VaultManager: '0xe19E99D644e56644CBd4428957996F9103b7C240',
    GMFOTToken: '0x614baD46b1CE22D30e2487DEC7ac4066bD485F5D',
    SavingsVault: '0xbcC2EDCf634E3AfA7dB64eDc4Be9E7F3558Cd757',
    OracleManager: '0xBD8B6276E5CBfF529F4aa918188A7411fc0C606f',
    ChainlinkOracle: '0x1087E2a496a7F40554a25B0b3F6BF2b055210e1b',
    ManualOracle: '0x8bbBE37345470563C3d2b2c582189393BBf2416a',
    WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  },
} as const;

// Supported chain IDs
export const SUPPORTED_CHAINS = [4202, 11155111] as const;
export type SupportedChainId = typeof SUPPORTED_CHAINS[number];

// Type for contract addresses - make it flexible to handle network-specific properties
export type NetworkAddresses = {
  VaultManager?: string;
  GMFOTToken?: string;
  SavingsVault?: string;
  OracleManager?: string;
  ManualOracle?: string;
  RedStoneOracle?: string;
  ChainlinkOracle?: string;
  MockWETH?: string;
  MockUSDT?: string;
  MockUSDC?: string;
  WETH?: string;
  USDT?: string;
  USDC?: string;
  [key: string]: string | undefined;
};

// Export a type for contract names
export type ContractName = keyof NetworkAddresses;

// Helper function to get contract addresses for a specific chain
export function getContractAddresses(chainId?: number): NetworkAddresses | null {
  if (!chainId) return null;
  return CONTRACT_ADDRESSES[chainId as SupportedChainId] || null;
}

// Helper function to check if a chain is supported
export function isSupportedChain(chainId?: number): chainId is SupportedChainId {
  if (!chainId) return false;
  return SUPPORTED_CHAINS.includes(chainId as SupportedChainId);
}

// Get network name by chain ID
export function getNetworkName(chainId?: number): string {
  switch (chainId) {
    case 4202:
      return 'Lisk Sepolia';
    case 11155111:
      return 'Ethereum Sepolia';
    default:
      return 'Unknown Network';
  }
}

// Special address representing native ETH in contracts
export const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;
