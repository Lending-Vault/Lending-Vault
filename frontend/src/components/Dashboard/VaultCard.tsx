// src/components/Dashboard/VaultCard.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { formatCurrency, formatNumber } from '../../utils/mockData';

interface VaultCardProps {
  tokenName: string;
  tokenSymbol: string;
  network: 'Ethereum Sepolia' | 'Lisk Sepolia';
  collateralBalance: number;
  collateralAmount: number;
  tokenPrice: number;
  healthFactor: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  isConnected: boolean;
}

const VaultCard: React.FC<VaultCardProps> = ({
  tokenName,
  tokenSymbol,
  network,
  collateralBalance,
  collateralAmount,
  tokenPrice,
  healthFactor,
  onDeposit,
  onWithdraw,
  isConnected,
}) => {
  const getHealthFactorColor = () => {
    if (healthFactor >= 200) return 'text-success-400';
    if (healthFactor >= 150) return 'text-warning-400';
    return 'text-danger-400';
  };

  const getHealthFactorBg = () => {
    if (healthFactor >= 200) return 'bg-success-500/10';
    if (healthFactor >= 150) return 'bg-warning-500/10';
    return 'bg-danger-500/10';
  };

  return (
    <Card padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{tokenName}</h3>
            <p className="text-sm text-dark-textMuted">{network}</p>
          </div>
          <div className={`px-3 py-1 rounded-lg ${getHealthFactorBg()}`}>
            <p className="text-xs text-dark-textMuted mb-0.5">Health Factor</p>
            <p className={`text-lg font-bold ${getHealthFactorColor()}`}>
              {healthFactor > 0 ? healthFactor.toFixed(0) + '%' : 'N/A'}
            </p>
          </div>
        </div>

        {/* Collateral Info */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-textMuted">Collateral Balance</span>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{formatCurrency(collateralBalance)}</p>
              <p className="text-xs text-dark-textMuted">
                {formatNumber(collateralAmount)} {tokenSymbol}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-dark-border">
            <span className="text-sm text-dark-textMuted">Token Price</span>
            <p className="text-sm font-semibold text-white">{formatCurrency(tokenPrice)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {isConnected ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onDeposit}
              variant="primary"
              size="md"
              fullWidth
            >
              Deposit
            </Button>
            <Button
              onClick={onWithdraw}
              variant="secondary"
              size="md"
              fullWidth
              disabled={collateralBalance === 0}
            >
              Withdraw
            </Button>
          </div>
        ) : (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary-300">
              Connect your wallet to deposit {tokenSymbol}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VaultCard;
