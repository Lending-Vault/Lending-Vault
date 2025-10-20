import { ConnectButton } from '@rainbow-me/rainbowkit';
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 flex justify-end">
      <ConnectButton />
    </header>
  );
};

export default Header;
