// src/components/Modals/DepositModal.tsx
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import InfoBox from '../UI/InfoBox';
import { useNativeBalance } from '../../hooks';
import { formatUnits } from 'viem';

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

  // Get user's native ETH balance
  const { balance, refetch: refetchBalance } = useNativeBalance();

  const depositAmount = parseFloat(amount) || 0;
  const depositValue = depositAmount * tokenPrice;
  const newCollateral = currentCollateral + depositValue;
  const newCollateralAmount = currentCollateralAmount + depositAmount;

  // Get user's ETH balance in human-readable format
  const userBalance = balance ? parseFloat(formatUnits(balance, 18)) : 0;

  const handleMaxClick = () => {
    // Leave a small amount for gas fees (0.01 ETH)
    const maxAmount = Math.max(0, userBalance - 0.01);
    setAmount(maxAmount.toString());
  };

  const handleDeposit = async () => {
    try {
      await onDeposit?.(depositAmount);
      refetchBalance();
      onClose();
      // Reset
      setAmount('');
    } catch (error) {
      console.error('Deposit error:', error);
    }
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

        {/* Info Messages */}
        <div className="space-y-3">
          <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-4 flex gap-3">
            <svg className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-success-300">
              <p className="font-semibold mb-1">No Approval Needed!</p>
              <p>You're depositing native {tokenSymbol} directly. No token approval required - just one transaction!</p>
            </div>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-300">
              <p className="font-semibold mb-1">Minimum Deposit</p>
              <p>Minimum deposit is 0.01 {tokenSymbol} equivalent. Leave some {tokenSymbol} for gas fees.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleDeposit}
            disabled={depositAmount <= 0 || depositAmount > userBalance}
          >
            Deposit {amount || '0'} {tokenSymbol}
          </Button>

          <Button variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DepositModal;