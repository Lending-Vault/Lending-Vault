// src/components/Layout/Header.tsx
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Link, useLocation } from 'react-router-dom';
import { Home, PiggyBank } from 'lucide-react';

interface HeaderProps {
  selectedChain: 'ethereum' | 'lisk';
  onChainChange: (chain: 'ethereum' | 'lisk') => void;
}

const Header: React.FC<HeaderProps> = ({
}) => {
  const { isConnected } = useAccount();
  const location = useLocation();

  return (
    <header className="bg-dark-card border-b border-lisk-500/20 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90 lisk-glow-effect">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-lisk-400 to-lisk-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">L</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold gradient-lisk-strong whitespace-nowrap">
                LiquidVault
              </h1>
            </div>

            {/* Navigation Links - Only show when connected */}
            {isConnected && (
              <nav className="hidden md:flex gap-2 lg:gap-4">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/'
                      ? 'bg-lisk-500/20 text-lisk-400 border border-lisk-500/30'
                      : 'text-dark-textMuted hover:text-white hover:bg-lisk-500/10 hover:border-lisk-500/20 border border-transparent'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="font-medium text-sm lg:text-base">Dashboard</span>
                </Link>
                <Link
                  to="/savings"
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/savings'
                      ? 'bg-lisk-500/20 text-lisk-400 border border-lisk-500/30'
                      : 'text-dark-textMuted hover:text-white hover:bg-lisk-500/10 hover:border-lisk-500/20 border border-transparent'
                  }`}
                >
                  <PiggyBank className="w-4 h-4" />
                  <span className="font-medium text-sm lg:text-base">Savings</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right side - Chain Switcher & Wallet */}
          <div className="flex items-center gap-2 sm:gap-4">

           

            {/* RainbowKit Connect Button */}
            <div className="scale-90 sm:scale-100">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;