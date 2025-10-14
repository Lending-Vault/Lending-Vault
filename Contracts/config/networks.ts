/**
 * Network configuration for multi-chain deployment
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  oracle: {
    type: "chainlink" | "redstone" | "manual";
    available: boolean;
    feeds?: Record<string, string>;
  };
  tokens: {
    weth?: string;
    usdt?: string;
    usdc?: string;
  };
}

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // Ethereum Mainnet
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    oracle: {
      type: "chainlink",
      available: true,
      feeds: {
        "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        "USDT/USD": "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
        "USDC/USD": "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"
      }
    },
    tokens: {
      weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      usdc: "0xA0b86a33E6441b8C4C7C4b0b8C4C4C4C4C4C4C4C"
    }
  },

  // Ethereum Sepolia Testnet
  sepolia: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18
    },
    oracle: {
      type: "chainlink",
      available: true,
      feeds: {
        "ETH/USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        "USDT/USD": "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"
      }
    },
    tokens: {
      // Will deploy mock tokens
    }
  },

  // Lisk Mainnet
  lisk: {
    name: "Lisk",
    chainId: 1135,
    rpcUrl: "https://rpc.api.lisk.com",
    blockExplorer: "https://blockscout.lisk.com",
    nativeCurrency: {
      name: "Lisk",
      symbol: "LSK",
      decimals: 18
    },
    oracle: {
      type: "redstone",
      available: true,
      feeds: {
        "ETH": "ETH",
        "USDT": "USDT",
        "USDC": "USDC",
        "LSK": "LSK"
      }
    },
    tokens: {
      // Will deploy mock tokens or use bridged tokens
    }
  },

  // Lisk Sepolia Testnet
  liskSepolia: {
    name: "Lisk Sepolia",
    chainId: 4202,
    rpcUrl: "https://rpc.sepolia-api.lisk.com",
    blockExplorer: "https://sepolia-blockscout.lisk.com",
    nativeCurrency: {
      name: "Sepolia Lisk",
      symbol: "LSK",
      decimals: 18
    },
    oracle: {
      type: "redstone",
      available: true,
      feeds: {
        "ETH": "ETH",
        "USDT": "USDT",
        "USDC": "USDC"
      }
    },
    tokens: {
      // Will deploy mock tokens
    }
  },

  // Polygon (future expansion)
  polygon: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18
    },
    oracle: {
      type: "chainlink",
      available: true,
      feeds: {
        "ETH/USD": "0xF9680D99D6C9589e2a93a78A04A279e509205945",
        "USDT/USD": "0x0A6513e40db6EB1b165753AD52E80663aeA50545"
      }
    },
    tokens: {
      weth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    }
  },

  // Arbitrum (future expansion)
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    oracle: {
      type: "chainlink",
      available: true,
      feeds: {
        "ETH/USD": "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
        "USDT/USD": "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7"
      }
    },
    tokens: {
      weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      usdt: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    }
  }
};

/**
 * Get network configuration by name or chain ID
 */
export function getNetworkConfig(identifier: string | number): NetworkConfig | undefined {
  if (typeof identifier === "string") {
    return NETWORK_CONFIGS[identifier];
  }
  
  return Object.values(NETWORK_CONFIGS).find(config => config.chainId === identifier);
}

/**
 * Get oracle type for a network
 */
export function getOracleType(network: string): "chainlink" | "redstone" | "manual" {
  const config = getNetworkConfig(network);
  return config?.oracle.type || "manual";
}

/**
 * Check if Chainlink is available on a network
 */
export function isChainlinkAvailable(network: string): boolean {
  const config = getNetworkConfig(network);
  return config?.oracle.type === "chainlink" && config.oracle.available;
}

/**
 * Check if RedStone is available on a network
 */
export function isRedStoneAvailable(network: string): boolean {
  const config = getNetworkConfig(network);
  return config?.oracle.type === "redstone" && config.oracle.available;
}

/**
 * Get supported networks for deployment
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(NETWORK_CONFIGS);
}
