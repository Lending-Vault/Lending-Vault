// src/components/Modals/DepositModal.tsx
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import InfoBox from '../UI/InfoBox';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCollateral: number; // Current collateral in USD
  currentCollateralAmount: number; // Current amount in tokens
  tokenSymbol: string; // ETH, WETH, etc.
  tokenPrice: number; // Price per token in USD
  onDeposit?: (amount: number) => void; // Callback for integrator
}

const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  currentCollateral,
  currentCollateralAmount,
  tokenSymbol,
  tokenPrice,
  onDeposit,
}) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'confirm'>('input');
  const [loading, setLoading] = useState(false);

  const depositAmount = parseFloat(amount) || 0;
  const depositValue = depositAmount * tokenPrice;
  const newCollateral = currentCollateral + depositValue;
  const newCollateralAmount = currentCollateralAmount + depositAmount;

  const handleMaxClick = () => {
    // Mock: User has 10 ETH available
    setAmount('10');
  };

  const handleApprove = () => {
    setLoading(true);
    // Simulate approval transaction
    setTimeout(() => {
      setLoading(false);
      setStep('confirm');
    }, 2000);
  };

  const handleDeposit = () => {
    setLoading(true);
    // Simulate deposit transaction
    setTimeout(() => {
      setLoading(false);
      onDeposit?.(depositAmount);
      onClose();
      // Reset
      setAmount('');
      setStep('input');
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit Collateral">
      <div className="space-y-6">
        
        {/* Amount Input */}
        <Input
          label="Deposit Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          maxButton
          onMaxClick={handleMaxClick}
          suffix={tokenSymbol}
        />

        {/* USD Value Display */}
        {depositAmount > 0 && (
          <p className="text-sm text-dark-textMuted">
            ≈ ${depositValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
          </p>
        )}

        {/* Before/After Comparison */}
        <div>
          <p className="text-sm font-semibold text-white mb-3">Before → After</p>
          <div className="grid grid-cols-2 gap-4">
            <InfoBox
              label="Current Collateral"
              value={`$${currentCollateral.toLocaleString()}`}
              subValue={`${currentCollateralAmount} ${tokenSymbol}`}
            />
            <InfoBox
              label="New Collateral"
              value={`$${newCollateral.toLocaleString()}`}
              subValue={`${newCollateralAmount.toFixed(2)} ${tokenSymbol}`}
              variant={depositAmount > 0 ? 'success' : 'default'}
            />
          </div>
        </div>

        {/* Gas Fee Estimate */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-textMuted">Estimated Gas Fee</span>
            <span className="text-sm font-semibold text-white">~$5.00</span>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-300">
            <p className="font-semibold mb-1">Minimum Deposit</p>
            <p>Minimum deposit is 0.01 {tokenSymbol} equivalent.</p>
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
              disabled={depositAmount <= 0}
            >
              Approve {tokenSymbol}
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
              onClick={handleDeposit}
              loading={loading}
            >
              {loading ? 'Depositing...' : `Deposit ${amount} ${tokenSymbol}`}
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

export default DepositModal;