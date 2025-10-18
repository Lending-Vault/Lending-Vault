// src/components/Modals/WithdrawModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import InfoBox from '../UI/InfoBox';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCollateral: number; // Current collateral in USD
  currentCollateralAmount: number; // Current amount in tokens
  currentDebt: number; // Current debt in USD
  currentHealthFactor: number;
  tokenSymbol: string; // ETH, WETH, etc.
  tokenPrice: number; // Price per token in USD
  onWithdraw?: (amount: number) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  currentCollateral,
  currentCollateralAmount,
  currentDebt,
  currentHealthFactor,
  tokenSymbol,
  tokenPrice,
  onWithdraw,
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const withdrawAmount = parseFloat(amount) || 0;
  const withdrawValue = withdrawAmount * tokenPrice;
  const newCollateral = currentCollateral - withdrawValue;

  // Calculate new health factor
  const newHealthFactor = currentDebt > 0 ? (newCollateral / currentDebt) * 100 : 0;

  const hasDebt = currentDebt > 0;
  const canWithdraw = !hasDebt || newHealthFactor >= 150;
  const isWarning = hasDebt && newHealthFactor < 200 && newHealthFactor >= 150;
  const isDanger = hasDebt && newHealthFactor < 150;

  // Max withdrawable amount (maintaining 150% health factor)
  const maxWithdrawValue = hasDebt 
    ? Math.max(0, currentCollateral - (currentDebt * 1.5))
    : currentCollateral;
  const maxWithdrawAmount = maxWithdrawValue / tokenPrice;

  const handleMaxClick = () => {
    if (!hasDebt) {
      setAmount(currentCollateralAmount.toString());
    } else {
      setAmount(maxWithdrawAmount.toFixed(4));
    }
  };

  const handleWithdraw = () => {
    if (!canWithdraw) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onWithdraw?.(withdrawAmount);
      onClose();
      setAmount('');
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Collateral">
      <div className="space-y-6">
        
        {/* Available to Withdraw */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Total Collateral</span>
            <span className="text-sm font-semibold text-white">
              {currentCollateralAmount} {tokenSymbol} (${currentCollateral.toLocaleString()})
            </span>
          </div>
          {hasDebt && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-textMuted">Current Debt</span>
                <span className="text-sm font-semibold text-warning-400">${currentDebt.toLocaleString()}</span>
              </div>
              <div className="border-t border-dark-border pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Max Withdrawable</span>
                  <span className="text-lg font-bold text-primary-400">
                    {maxWithdrawAmount.toFixed(4)} {tokenSymbol}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Amount Input */}
        <Input
          label="Withdrawal Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          maxButton
          onMaxClick={handleMaxClick}
          suffix={tokenSymbol}
          error={withdrawAmount > currentCollateralAmount ? 'Insufficient collateral' : undefined}
        />

        {/* USD Value */}
        {withdrawAmount > 0 && (
          <p className="text-sm text-dark-textMuted">
            ≈ ${withdrawValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
          </p>
        )}

        {/* Health Factor Preview (only if has debt) */}
        {hasDebt && withdrawAmount > 0 && (
          <div>
            <p className="text-sm font-semibold text-white mb-3">Health Factor Impact</p>
            <div className="grid grid-cols-2 gap-4">
              <InfoBox
                label="Current"
                value={`${currentHealthFactor}%`}
                variant="success"
              />
              <InfoBox
                label="After Withdrawal"
                value={`${newHealthFactor.toFixed(0)}%`}
                variant={
                  isDanger ? 'danger' :
                  isWarning ? 'warning' :
                  'success'
                }
              />
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {!hasDebt && withdrawAmount > 0 && (
          <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-4">
            <p className="text-sm text-success-300">
              ✓ No active debt. You can withdraw all your collateral anytime.
            </p>
          </div>
        )}

        {isWarning && withdrawAmount > 0 && (
          <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-300">
              <p className="font-semibold mb-1">Warning: Low Health Factor</p>
              <p>Withdrawing this amount will bring your position close to liquidation threshold (150%).</p>
            </div>
          </div>
        )}

        {isDanger && withdrawAmount > 0 && (
          <div className="bg-danger-500/10 border border-danger-500/30 rounded-lg p-4 flex gap-3">
            <XCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-danger-300">
              <p className="font-semibold mb-1">Cannot Withdraw</p>
              <p>This withdrawal would drop your health factor below 150%, risking liquidation. Reduce the amount or repay debt first.</p>
            </div>
          </div>
        )}

        {/* Liquidation Threshold Info */}
        {hasDebt && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <p className="text-sm text-primary-300">
              <strong>Note:</strong> Withdrawals must maintain a health factor above 150% to prevent liquidation.
            </p>
          </div>
        )}

        {/* Gas Fee */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Estimated Gas Fee</span>
            <span className="text-sm font-semibold text-white">~$4.00</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleWithdraw}
            loading={loading}
            disabled={withdrawAmount <= 0 || withdrawAmount > currentCollateralAmount || isDanger}
          >
            {loading ? 'Withdrawing...' : `Withdraw ${amount || '0'} ${tokenSymbol}`}
          </Button>

          <Button variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawModal;