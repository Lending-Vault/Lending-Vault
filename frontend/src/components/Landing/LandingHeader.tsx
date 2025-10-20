import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X } from 'lucide-react';

const LandingHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Statistics', href: '#stats' },
    { name: 'Documentation', href: '#docs' }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'glass-strong border-b border-dark-border backdrop-blur-xl' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-lisk-400 to-lisk-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LV</span>
            </div>
            <span className="text-xl font-bold text-white">LiquidVault</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-dark-textMuted hover:text-lisk-400 transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTA & Wallet */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/dashboard"
              className="bg-gradient-to-r from-lisk-500 to-lisk-600 hover:from-lisk-400 hover:to-lisk-500 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-lisk-glow"
            >
              Launch App
            </Link>
            <ConnectButton />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-dark-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-dark-textMuted hover:text-lisk-400 hover:bg-white/5 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 pb-2 border-t border-dark-border">
                <Link
                  to="/dashboard"
                  className="block w-full text-center bg-gradient-to-r from-lisk-500 to-lisk-600 hover:from-lisk-400 hover:to-lisk-500 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 mb-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Launch App
                </Link>
                <div className="px-3">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default LandingHeader;