// src/components/Modals/RepayModal.tsx
import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import InfoBox from '../UI/InfoBox';

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDebt: number; // Current debt in USD
  debtToken: string; // USDT or USDC
  interestRate: number; // Fixed 8% APR
  borrowDate?: Date; // When the loan was taken (for interest calculation)
  onRepay?: (amount: number) => void;
}

const RepayModal: React.FC<RepayModalProps> = ({
  isOpen,
  onClose,
  currentDebt,
  debtToken,
  interestRate = 8,
  borrowDate = new Date(),
  onRepay,
}) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'confirm'>('input');
  const [loading, setLoading] = useState(false);

  // Calculate accrued interest (simplified calculation)
  const daysSinceBorrow = Math.floor((Date.now() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
  const accruedInterest = (currentDebt * (interestRate / 100) * daysSinceBorrow) / 365;
  const totalOwed = currentDebt + accruedInterest;

  const repayAmount = parseFloat(amount) || 0;
  const newDebt = Math.max(0, currentDebt - repayAmount);
  const remainingInterest = (newDebt * (interestRate / 100) * daysSinceBorrow) / 365;

  const handleMaxClick = () => {
    setAmount(totalOwed.toFixed(2));
  };

  const handleApprove = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('confirm');
    }, 2000);
  };

  const handleRepay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onRepay?.(repayAmount);
      onClose();
      setAmount('');
      setStep('input');
    }, 2000);
  };

  const isFullRepayment = repayAmount >= totalOwed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Repay Debt">
      <div className="space-y-6">
        
        {/* Debt Breakdown */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Principal</span>
            <span className="text-sm font-semibold text-white">${currentDebt.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Accrued Interest ({interestRate}% APR)</span>
            <span className="text-sm font-semibold text-warning-400">+${accruedInterest.toFixed(2)}</span>
          </div>
          <div className="border-t border-dark-border pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-white">Total Owed</span>
              <span className="text-lg font-bold text-white">${totalOwed.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <Input
          label="Repayment Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          maxButton
          onMaxClick={handleMaxClick}
          suffix={debtToken}
          error={repayAmount > totalOwed ? 'Amount exceeds total debt' : undefined}
        />

        {/* Repayment Type Info */}
        {repayAmount > 0 && (
          <div className={`rounded-lg p-4 flex gap-3 ${
            isFullRepayment 
              ? 'bg-success-500/10 border border-success-500/30' 
              : 'bg-primary-500/10 border border-primary-500/30'
          }`}>
            {isFullRepayment ? (
              <>
                <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-success-300">
                  <p className="font-semibold mb-1">Full Repayment</p>
                  <p>This will clear your entire debt. You can withdraw your collateral after.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-300">
                  <p className="font-semibold mb-1">Partial Repayment</p>
                  <p>Interest will continue to accrue on remaining balance at {interestRate}% APR.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Before/After Comparison */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">Debt Status</p>
          <div className="grid grid-cols-2 gap-4">
            <InfoBox
              label="Current Debt"
              value={`$${currentDebt.toLocaleString()}`}
              subValue={`+$${accruedInterest.toFixed(2)} interest`}
              variant="warning"
            />
            <InfoBox
              label="After Repayment"
              value={repayAmount > 0 ? `$${newDebt.toLocaleString()}` : '--'}
              subValue={newDebt > 0 ? `~$${remainingInterest.toFixed(2)} interest` : 'Debt cleared'}
              variant={isFullRepayment ? 'success' : 'default'}
            />
          </div>
        </div>

        {/* No Early Repayment Penalty */}
        <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-4">
          <p className="text-sm text-success-300">
            ✓ No early repayment penalties. Pay anytime without extra fees.
          </p>
        </div>

        {/* Gas Fee */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Estimated Gas Fee</span>
            <span className="text-sm font-semibold text-white">~$6.00</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {step === 'input' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleApprove}
              disabled={repayAmount <= 0 || repayAmount > totalOwed}
            >
              Approve {debtToken}
            </Button>
          )}

          {step === 'approve' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleApprove}
              loading={loading}
            >
              {loading ? 'Approving...' : 'Approve Transaction'}
            </Button>
          )}

          {step === 'confirm' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleRepay}
              loading={loading}
            >
              {loading ? 'Repaying...' : `Repay ${amount} ${debtToken}`}
            </Button>
          )}

          <Button variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RepayModal;