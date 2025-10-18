// src/components/Dashboard/GMFOTCard.tsx
import React from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { formatCurrency, formatNumber } from '../../utils/mockData';

interface GMFOTCardProps {
  totalBorrowed: number;
  totalRepaid: number;
  currentDebt: number;
  interestRate: number;
  onBorrow: () => void;
  onRepay: () => void;
  isConnected: boolean;
}

const GMFOTCard: React.FC<GMFOTCardProps> = ({
  totalBorrowed,
  totalRepaid,
  currentDebt,
  interestRate,
  onBorrow,
  onRepay,
  isConnected,
}) => {
  return (
    <Card padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">GMFOT Token</h3>
              <p className="text-sm text-dark-textMuted">Stablecoin Borrowed</p>
            </div>
          </div>
          <div className="bg-primary-500/10 px-3 py-1 rounded-lg">
            <p className="text-xs text-dark-textMuted mb-0.5">Interest Rate</p>
            <p className="text-lg font-bold text-primary-400">{interestRate}%</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <p className="text-xs text-dark-textMuted mb-1">Current Debt</p>
            <p className="text-lg font-bold text-white">{formatCurrency(currentDebt)}</p>
            <p className="text-xs text-dark-textMuted mt-0.5">
              {formatNumber(currentDebt)} GMFOT
            </p>
          </div>

          <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
            <p className="text-xs text-dark-textMuted mb-1">Total Borrowed</p>
            <p className="text-lg font-bold text-success-400">{formatCurrency(totalBorrowed)}</p>
            <p className="text-xs text-dark-textMuted mt-0.5">
              {formatNumber(totalBorrowed)} GMFOT
            </p>
          </div>

          <div className="bg-dark-bg border border-dark-border rounded-lg p-3 col-span-2 sm:col-span-1">
            <p className="text-xs text-dark-textMuted mb-1">Total Repaid</p>
            <p className="text-lg font-bold text-warning-400">{formatCurrency(totalRepaid)}</p>
            <p className="text-xs text-dark-textMuted mt-0.5">
              {formatNumber(totalRepaid)} GMFOT
            </p>
          </div>
        </div>

        {/* Interest Info */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-primary-300">
            <p className="font-semibold mb-1">How It Works</p>
            <p>Deposit collateral (WETH) on any supported network, then borrow GMFOT stablecoins at {interestRate}% annual interest rate.</p>
          </div>
        </div>

        {/* Action Buttons */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onBorrow}
              variant="primary"
              size="md"
              fullWidth
            >
              Borrow
            </Button>
            <Button
              onClick={onRepay}
              variant="secondary"
              size="md"
              fullWidth
              disabled={currentDebt === 0}
            >
              Repay
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GMFOTCard;
