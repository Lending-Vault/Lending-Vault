// src/components/Modals/BorrowModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import InfoBox from '../UI/InfoBox';
import PriceDisplay from '../UI/PriceDisplay';
import { getHealthFactorStatus } from '../../utils/mockData';
import { diagnoseBorrowIssues, formatDiagnosticReport } from '../../utils/diagnoseBorrowIssue';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  collateralValue: number; // Current collateral in USD
  currentDebt: number; // Current debt in USD
  currentHealthFactor: number;
  maxBorrowAmount: number; // 50% of collateral
  interestRate: number; // Fixed 8% APR
  onBorrow?: (amount: number) => void;
}

const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  onClose,
  collateralValue,
  currentDebt,
  currentHealthFactor,
  maxBorrowAmount,
  interestRate = 8,
  onBorrow,
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  const borrowAmount = parseFloat(amount) || 0;
  const newDebt = currentDebt + borrowAmount;
  const newHealthFactor = newDebt > 0 ? (collateralValue / newDebt) * 100 : 0;
  const annualInterest = borrowAmount * (interestRate / 100);

  const isWarning = newHealthFactor < 200 && newHealthFactor >= 150;
  const isDanger = newHealthFactor < 150;

  const handleMaxClick = () => {
    setAmount(maxBorrowAmount.toString());
  };

  const handleBorrow = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onBorrow?.(borrowAmount);
      onClose();
      setAmount('');
    }, 2000);
  };

  const handleDiagnostics = async () => {
    setDiagnosticLoading(true);
    try {
      const results = await diagnoseBorrowIssues();
      const report = formatDiagnosticReport(results);
      alert(report);
    } catch (error) {
      console.error('Diagnostic error:', error);
      alert('Failed to run diagnostics. Please check console for details.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Borrow GMFOT">
      <div className="space-y-6">
        
        {/* Amount Input */}
        <Input
          label="Borrow Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          maxButton
          onMaxClick={handleMaxClick}
          suffix="GMFOT"
          error={borrowAmount > maxBorrowAmount ? `Maximum borrow: $${maxBorrowAmount.toLocaleString()}` : undefined}
        />

        {/* Max Borrow Info */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-dark-textMuted">Maximum LTV</span>
            <span className="text-sm font-semibold text-white">50%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Available to Borrow</span>
            <span className="text-sm font-semibold text-primary-400">${maxBorrowAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Price Display */}
        <PriceDisplay className="mb-4" />

        {/* Interest Rate Info */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-semibold text-white">Fixed Interest Rate: {interestRate}% APR</p>
            <div className="group relative">
              <AlertCircle className="w-4 h-4 text-primary-400 cursor-help" />
              <div className="hidden group-hover:block absolute z-10 right-0 w-64 p-3 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs text-dark-textMuted">
                Interest accrues continuously on your borrowed amount. Repay anytime to stop interest accumulation. No early repayment penalty!
              </div>
            </div>
          </div>
          {borrowAmount > 0 && (
            <div className="space-y-1 text-sm text-dark-textMuted">
              <p>Annual Interest: ${annualInterest.toFixed(2)}</p>
              <p>Monthly Interest: ${(annualInterest / 12).toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Health Factor Preview */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">Health Factor</p>
          <div className="grid grid-cols-2 gap-4">
            <InfoBox
              label="Current"
              value={`${currentHealthFactor}%`}
              variant={getHealthFactorStatus(currentHealthFactor).label === 'Safe' ? 'success' : 'warning'}
            />
            <InfoBox
              label="After Borrow"
              value={borrowAmount > 0 ? `${newHealthFactor.toFixed(0)}%` : '--'}
              variant={
                borrowAmount === 0 ? 'default' :
                isDanger ? 'danger' :
                isWarning ? 'warning' :
                'success'
              }
            />
          </div>
        </div>

        {/* Warning Messages */}
        {isWarning && borrowAmount > 0 && (
          <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-300">
              <p className="font-semibold mb-1">Warning: Low Health Factor</p>
              <p>Your position will be close to liquidation threshold (150%). Consider borrowing less.</p>
            </div>
          </div>
        )}

        {isDanger && borrowAmount > 0 && (
          <div className="bg-danger-500/10 border border-danger-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-danger-300">
              <p className="font-semibold mb-1">Danger: Liquidation Risk</p>
              <p>This amount will put your position at risk of liquidation. Please reduce the borrow amount.</p>
            </div>
          </div>
        )}

        {/* Gas Fee */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Estimated Gas Fee</span>
            <span className="text-sm font-semibold text-white">~$0.04</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleBorrow}
            loading={loading}
            disabled={borrowAmount <= 0 || borrowAmount > maxBorrowAmount || isDanger}
          >
            {loading ? 'Borrowing...' : `Borrow ${amount || '0'} USDT`}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleDiagnostics}
              loading={diagnosticLoading}
            >
              {diagnosticLoading ? 'Running...' : 'Run Diagnostics'}
            </Button>

            <Button variant="ghost" fullWidth onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BorrowModal;