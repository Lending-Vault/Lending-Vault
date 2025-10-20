// src/components/Modals/StakeModal.tsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Lock, TrendingUp } from 'lucide-react';
import { formatUnits } from 'viem';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Button from '../UI/Button';
import {
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useDepositSavings,
  useMinimumDeposit,
  LockPeriod,
  getLockPeriodDays,
} from '../../hooks';
import { getContractAddresses } from '../../config/contracts';
import { formatTokenAmount } from '../../hooks/useERC20';
import { useAccount } from 'wagmi';

interface StakeModalProps{
  isOpen: boolean;
  onClose: () => void;
  gftRewards?: {
    quarterly?: bigint;
    semiAnnual?: bigint;
    annual?: bigint;
  };
}

const StakeModal: React.FC<StakeModalProps> = ({
  isOpen,
  onClose,
  gftRewards,
}) => {
  const [amount, setAmount] = useState('');
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<number>(LockPeriod.QUARTERLY);
  const [step, setStep] = useState<'input' | 'approve' | 'confirm'>('input');

  // Get contract addresses for current network
  const { chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  // Token hooks - using MockUSDT as stablecoin
  const tokenAddress = contractAddresses?.MockUSDT as `0x${string}` | undefined;
  const savingsVaultAddress = contractAddresses?.SavingsVault as `0x${string}` | undefined;

  const { balance, refetch: refetchBalance } = useTokenBalance(tokenAddress);
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(tokenAddress, savingsVaultAddress);
  const { approve, isPending: isApproving, isSuccess: isApproveSuccess } = useApproveToken();
  const { deposit, isPending: isDepositPending, isSuccess: isDepositSuccess } = useDepositSavings();
  const { minimumDeposit } = useMinimumDeposit();

  // Check if approval is needed
  const depositAmount = parseFloat(amount) || 0;
  const depositAmountBigInt = BigInt(Math.floor(depositAmount * 1e18));
  const needsApproval = allowance !== undefined && allowance !== null && typeof allowance === 'bigint' && depositAmountBigInt > allowance;

  // Get user's token balance
  const userBalance = balance && typeof balance === 'bigint' ? parseFloat(formatTokenAmount(balance, 18)) : 0;
  const minDeposit = minimumDeposit && typeof minimumDeposit === 'bigint' ? parseFloat(formatUnits(minimumDeposit, 18)) : 100;

  // Get GFT reward for selected lock period
  const getGftReward = () => {
    if (!gftRewards) return '0';
    switch (selectedLockPeriod) {
      case 0: // QUARTERLY
        return gftRewards.quarterly && typeof gftRewards.quarterly === 'bigint' ? formatUnits(gftRewards.quarterly, 18) : '0';
      case 1: // SEMI_ANNUAL
        return gftRewards.semiAnnual && typeof gftRewards.semiAnnual === 'bigint' ? formatUnits(gftRewards.semiAnnual, 18) : '0';
      case 2: // ANNUAL
        return gftRewards.annual && typeof gftRewards.annual === 'bigint' ? formatUnits(gftRewards.annual, 18) : '0';
      default:
        return '0';
    }
  };

  // Calculate interest (only for annual)
  const calculateInterest = () => {
    if (selectedLockPeriod === 2) { // LockPeriod.ANNUAL
      return depositAmount * 0.02; // 2% annual interest
    }
    return 0;
  };

  // Auto-advance to confirm step after approval succeeds
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setStep('confirm');
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Close modal and reset after successful deposit
  useEffect(() => {
    if (isDepositSuccess) {
      refetchBalance();
      onClose();
      setAmount('');
      setStep('input');
      setSelectedLockPeriod(LockPeriod.QUARTERLY);
    }
  }, [isDepositSuccess, refetchBalance, onClose]);

  const handleMaxClick = () => {
    setAmount(userBalance.toString());
  };

  const handleApprove = async () => {
    if (!tokenAddress || !savingsVaultAddress) {
      console.error('Token or vault address not found');
      return;
    }
    try {
      setStep('approve');
      await approve(tokenAddress, savingsVaultAddress, amount, 18);
    } catch (error) {
      console.error('Approval error:', error);
      setStep('input');
    }
  };

  const handleDeposit = async () => {
    if (!tokenAddress) {
      console.error('Token address not found');
      return;
    }
    try {
      await deposit(tokenAddress, amount, 18, selectedLockPeriod as number);
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  const handleNextStep = () => {
    if (needsApproval) {
      handleApprove();
    } else {
      setStep('confirm');
    }
  };

  const isAmountValid = depositAmount >= minDeposit && depositAmount <= userBalance;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stake Stablecoins">
      <div className="space-y-6">

        {/* Amount Input */}
        <Input
          label="Stake Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          type="number"
          maxButton
          onMaxClick={handleMaxClick}
          suffix="USDT"
        />

        {/* Balance Display */}
        <div className="flex justify-between text-sm">
          <span className="text-dark-textMuted">Available Balance:</span>
          <span className="text-white font-medium">{userBalance.toFixed(2)} USDT</span>
        </div>

        {/* Lock Period Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Select Lock Period
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[LockPeriod.QUARTERLY, LockPeriod.SEMI_ANNUAL, LockPeriod.ANNUAL].map((period: number) => (
              <button
                key={period}
                onClick={() => setSelectedLockPeriod(period)}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  selectedLockPeriod === period
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-border bg-dark-bg hover:border-dark-hover'
                }`}
              >
                <Lock className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 ${
                  selectedLockPeriod === period ? 'text-primary-400' : 'text-dark-textMuted'
                }`} />
                <p className={`text-xs sm:text-sm font-medium ${
                  selectedLockPeriod === period ? 'text-white' : 'text-dark-textMuted'
                }`}>
                  {period === 0 && '3 months'}
                  {period === 1 && '6 months'}
                  {period === 2 && '12 months'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Rewards Summary */}
        {depositAmount > 0 && (
          <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-success-400" />
              <h4 className="font-semibold text-white">Your Rewards</h4>
            </div>

            <div className="space-y-2">
              {selectedLockPeriod === 2 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-dark-textMuted">Stablecoin Interest (2% APY)</span>
                  <span className="text-sm font-semibold text-success-400">
                    +${calculateInterest().toFixed(2)} USDT
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-textMuted">GFT Token Reward</span>
                <span className="text-sm font-semibold text-warning-400">
                  +{getGftReward()} GFT
                </span>
              </div>

              <div className="pt-2 mt-2 border-t border-dark-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">Total Value at Maturity</span>
                  <span className="text-sm font-bold text-white">
                    ${(depositAmount + calculateInterest()).toFixed(2)}
                    {getGftReward() !== '0' && ` + ${getGftReward()} GFT`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-300">
            <p className="font-semibold mb-1">Lock Period Notice</p>
            <p>Your funds will be locked for {getLockPeriodDays(selectedLockPeriod as number)} days. Early withdrawal incurs a 10% penalty and forfeits all rewards.</p>
          </div>
        </div>

        {/* Validation Messages */}
        {depositAmount > 0 && depositAmount < minDeposit && (
          <div className="bg-error-500/10 border border-error-500/30 rounded-lg p-3 text-sm text-error-300">
            Minimum stake amount is {minDeposit} USDT
          </div>
        )}

        {depositAmount > userBalance && (
          <div className="bg-error-500/10 border border-error-500/30 rounded-lg p-3 text-sm text-error-300">
            Insufficient balance
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {step === 'input' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleNextStep}
              disabled={!isAmountValid}
            >
              {needsApproval ? 'Approve USDT' : 'Review Stake'}
            </Button>
          )}

          {step === 'approve' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleApprove}
              loading={isApproving}
              disabled={isApproving}
            >
              {isApproving ? 'Approving...' : 'Approve Transaction'}
            </Button>
          )}

          {step === 'confirm' && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleDeposit}
              loading={isDepositPending}
              disabled={isDepositPending}
            >
              {isDepositPending ? 'Staking...' : `Stake ${amount} USDT`}
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

export default StakeModal;
