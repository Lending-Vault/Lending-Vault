// src/components/Layout/Header.tsx
import React from 'react';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';
import Button from '../UI/Button';

interface HeaderProps {
  onConnectWallet: () => void;
  selectedChain: 'ethereum' | 'lisk';
  onChainChange: (chain: 'ethereum' | 'lisk') => void;
  isConnected?: boolean;
  walletAddress?: string;
  onDisconnect?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onConnectWallet,
  selectedChain,
  onChainChange,
  isConnected = false,
  walletAddress = '',
  onDisconnect,
}) => {
  return (
    <header className="bg-dark-card border-b border-dark-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold gradient-text">
              LiquidVault
            </h1>
          </div>

          {/* Right side - Chain Switcher & Wallet */}
          <div className="flex items-center gap-4">
            
            {/* Chain Switcher - Only show when connected */}
            {isConnected && (
              <select
                value={selectedChain}
                onChange={(e) => onChainChange(e.target.value as 'ethereum' | 'lisk')}
                className="bg-dark-bg border-2 border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 cursor-pointer hover:border-primary-500/50 transition-colors"
              >
                <option value="ethereum">Ethereum Sepolia</option>
                <option value="lisk">Lisk Sepolia</option>
              </select>
            )}

            {/* Wallet Button */}
            {!isConnected ? (
              <Button
                variant="primary"
                icon={<Wallet className="w-5 h-5" />}
                onClick={onConnectWallet}
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Connected Wallet Address */}
                <div className="hidden sm:flex items-center gap-2 bg-dark-bg border-2 border-primary-500/30 rounded-lg px-4 py-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                  <span className="text-white font-medium font-mono text-sm">
                    {walletAddress}
                  </span>
                </div>

                {/* Disconnect Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={onDisconnect}
                  className="hidden sm:flex"
                >
                  Disconnect
                </Button>

                {/* Mobile - Just show address */}
                <button
                  onClick={onDisconnect}
                  className="sm:hidden bg-dark-bg border-2 border-primary-500/30 rounded-lg px-3 py-2 text-white font-mono text-sm"
                >
                  {walletAddress}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;