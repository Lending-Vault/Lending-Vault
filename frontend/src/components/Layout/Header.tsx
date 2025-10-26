import { ConnectButton } from '@rainbow-me/rainbowkit';
import React from 'react';

interface HeaderProps {
  selectedChain?: 'ethereum' | 'lisk';
  onChainChange?: (chain: 'ethereum' | 'lisk') => void;
}

const Header: React.FC<HeaderProps> = ({ selectedChain: _selectedChain, onChainChange: _onChainChange }) => {
  return (
    <header className="w-full p-4 flex justify-end">
      <ConnectButton />
    </header>
  );
};

export default Header;
