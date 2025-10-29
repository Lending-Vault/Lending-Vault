import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, liskSepolia } from 'wagmi/chains';

// Custom chain configurations with our RPC URLs
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    ...sepolia.rpcUrls,
    default: {
      http: [import.meta.env.VITE_SEPOLIA_RPC_URL || sepolia.rpcUrls.default.http[0]],
    },
  },
};

const customLiskSepolia = {
  ...liskSepolia,
  rpcUrls: {
    ...liskSepolia.rpcUrls,
    default: {
      http: [import.meta.env.VITE_LISK_SEPOLIA_RPC_URL || liskSepolia.rpcUrls.default.http[0]],
    },
  },
};

// Configure RainbowKit with Wagmi
export const config = getDefaultConfig({
  appName: 'LiquidVault',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [customSepolia, customLiskSepolia],
  ssr: false, // We're using Vite/SPA, not SSR
});
