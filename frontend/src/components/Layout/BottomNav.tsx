// src/components/Layout/BottomNav.tsx
import React from 'react';
import { Download, TrendingUp, CreditCard, Upload, Home, PiggyBank } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ModalType } from '../../types';

interface BottomNavProps {
  onOpenModal: (type: ModalType) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onOpenModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';
  const isSavings = location.pathname === '/savings';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border backdrop-blur-sm bg-opacity-95 z-40 md:hidden">
      <div className="grid grid-cols-6 gap-1 px-2 py-3">
        
        {/* Deposit */}
        <button
          onClick={() => onOpenModal('deposit')}
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg hover:bg-dark-cardHover active:bg-dark-border transition-colors"
        >
          <Download className="w-5 h-5 text-primary-400" />
          <span className="text-xs font-medium text-white">Deposit</span>
        </button>

        {/* Borrow */}
        <button
          onClick={() => onOpenModal('borrow')}
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg hover:bg-dark-cardHover active:bg-dark-border transition-colors"
        >
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <span className="text-xs font-medium text-white">Borrow</span>
        </button>

        {/* Repay */}
        <button
          onClick={() => onOpenModal('repay')}
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg hover:bg-dark-cardHover active:bg-dark-border transition-colors"
        >
          <CreditCard className="w-5 h-5 text-success-400" />
          <span className="text-xs font-medium text-white">Repay</span>
        </button>

        {/* Withdraw */}
        <button
          onClick={() => onOpenModal('withdraw')}
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg hover:bg-dark-cardHover active:bg-dark-border transition-colors"
        >
          <Upload className="w-5 h-5 text-success-400" />
          <span className="text-xs font-medium text-white">Withdraw</span>
        </button>

        {/* Dashboard */}
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            isDashboard ? 'bg-primary-500/10' : 'hover:bg-dark-cardHover active:bg-dark-border'
          }`}
        >
          <Home className={`w-5 h-5 ${isDashboard ? 'text-primary-400' : 'text-dark-textMuted'}`} />
          <span className={`text-xs font-medium ${isDashboard ? 'text-primary-400' : 'text-white'}`}>Dashboard</span>
        </button>

        {/* Savings */}
        <button
          onClick={() => navigate('/savings')}
          className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            isSavings ? 'bg-primary-500/10' : 'hover:bg-dark-cardHover active:bg-dark-border'
          }`}
        >
          <PiggyBank className={`w-5 h-5 ${isSavings ? 'text-primary-400' : 'text-dark-textMuted'}`} />
          <span className={`text-xs font-medium ${isSavings ? 'text-primary-400' : 'text-white'}`}>Savings</span>
        </button>

      </div>
    </nav>
  );
};

export default BottomNav;