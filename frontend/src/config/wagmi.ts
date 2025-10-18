import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, liskSepolia } from 'wagmi/chains';

// Configure RainbowKit with Wagmi
export const config = getDefaultConfig({
  appName: 'LiquidVault',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [sepolia, liskSepolia],
  ssr: false, // We're using Vite/SPA, not SSR
});
