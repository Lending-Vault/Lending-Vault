// src/components/Dashboard/ActionButtons.tsx
import React from 'react';
import { Download, TrendingUp, CreditCard, Upload } from 'lucide-react';
import Button from '../UI/Button';
import type { ModalType } from '../../types';

interface ActionButtonsProps {
  onOpenModal: (type: ModalType) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onOpenModal }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<Download className="w-5 h-5" />}
        onClick={() => onOpenModal('deposit')}
      >
        Deposit
      </Button>
      
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<TrendingUp className="w-5 h-5" />}
        onClick={() => onOpenModal('borrow')}
      >
        Borrow
      </Button>
      
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        icon={<CreditCard className="w-5 h-5" />}
        onClick={() => onOpenModal('repay')}
      >
        Repay
      </Button>
      
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        icon={<Upload className="w-5 h-5" />}
        onClick={() => onOpenModal('withdraw')}
      >
        Withdraw
      </Button>
    </div>
  );
};

export default ActionButtons;