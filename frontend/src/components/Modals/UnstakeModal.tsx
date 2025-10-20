// src/components/Modals/UnstakeModal.tsx
import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import {
  useWithdrawSavings,
  formatSavingsPosition,
  getLockPeriodName,
  getDaysRemaining,
  useEarlyWithdrawalPenalty,
  type SavingsPosition,
} from '../../hooks';

interface UnstakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: SavingsPosition | null;
  positionIndex: number | null;
}

const UnstakeModal: React.FC<UnstakeModalProps> = ({
  isOpen,
  onClose,
  position,
  positionIndex,
}) => {
  const { withdraw, isPending, isSuccess } = useWithdrawSavings();
  const { penalty } = useEarlyWithdrawalPenalty();

  // Close modal after successful withdrawal
  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  if (!position || positionIndex === null) {
    return null;
  }

  const formatted = formatSavingsPosition(position);
  const isUnlocked = formatted.isUnlocked;
  const daysRemaining = getDaysRemaining(position.lockEndTime);

  // Calculate penalty amount
  const penaltyRate = penalty ? Number(penalty) / 10000 : 0.1; // Default 10%
  const penaltyAmount = parseFloat(formatted.principal) * penaltyRate;
  const principalAfterPenalty = parseFloat(formatted.principal) - penaltyAmount;

  const handleWithdraw = async () => {
    try {
      await withdraw(positionIndex);
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Savings">
      <div className="space-y-6">

        {/* Position Info */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-dark-textMuted mb-3">Position Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-dark-textMuted">Position ID</span>
              <span className="text-sm font-semibold text-white">#{formatted.positionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-dark-textMuted">Principal Amount</span>
              <span className="text-sm font-semibold text-white">${formatted.principal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-dark-textMuted">Lock Period</span>
              <span className="text-sm font-semibold text-white">{getLockPeriodName(position.lockPeriod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-dark-textMuted">Deposited On</span>
              <span className="text-sm font-semibold text-white">
                {formatted.depositTime.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-dark-textMuted">Unlock Date</span>
              <span className={`text-sm font-semibold ${isUnlocked ? 'text-success-400' : 'text-warning-400'}`}>
                {formatted.lockEndTime.toLocaleDateString()}
                {!isUnlocked && ` (${daysRemaining}d left)`}
              </span>
            </div>
          </div>
        </div>

        {/* Early Withdrawal Warning */}
        {!isUnlocked && (
          <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-300">
              <p className="font-semibold mb-2">Early Withdrawal Penalty</p>
              <p className="mb-2">
                Your position is still locked for {daysRemaining} more days.
                Withdrawing now will incur a {(penaltyRate * 100).toFixed(0)}% penalty on your principal.
              </p>
              <div className="bg-dark-bg/50 rounded p-2 mt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Principal:</span>
                  <span className="text-xs font-medium">${formatted.principal}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Penalty ({(penaltyRate * 100).toFixed(0)}%):</span>
                  <span className="text-xs font-medium text-error-400">-${penaltyAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-warning-500/20">
                  <span className="text-xs font-semibold">You'll Receive:</span>
                  <span className="text-xs font-semibold">${principalAfterPenalty.toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs">All rewards (interest and GFT tokens) will be forfeited.</p>
            </div>
          </div>
        )}

        {/* Withdrawal Summary */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-success-400" />
            <h4 className="font-semibold text-white">Withdrawal Summary</h4>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-textMuted">Principal</span>
              <span className="text-sm font-semibold text-white">
                {isUnlocked ? `$${formatted.principal}` : `$${principalAfterPenalty.toFixed(2)}`}
              </span>
            </div>

            {isUnlocked && formatted.stablecoinInterest !== '0.0' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-textMuted">Stablecoin Interest</span>
                <span className="text-sm font-semibold text-success-400">
                  +${formatted.stablecoinInterest}
                </span>
              </div>
            )}

            {isUnlocked && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-textMuted">GFT Token Reward</span>
                <span className="text-sm font-semibold text-warning-400">
                  +{formatted.gftReward} GFT
                </span>
              </div>
            )}

            {!isUnlocked && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-textMuted">Penalty</span>
                <span className="text-sm font-semibold text-error-400">
                  -${penaltyAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-2 mt-2 border-t border-dark-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Total Withdrawal</span>
                <span className="text-sm font-bold text-white">
                  {isUnlocked ? (
                    <>
                      ${(parseFloat(formatted.principal) + parseFloat(formatted.stablecoinInterest || '0')).toFixed(2)}
                      {formatted.gftReward !== '0.0' && ` + ${formatted.gftReward} GFT`}
                    </>
                  ) : (
                    `$${principalAfterPenalty.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Info (when unlocked) */}
        {isUnlocked && (
          <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-success-300">
              <p className="font-semibold mb-1">Position Unlocked</p>
              <p>Your position has reached maturity. You can withdraw your full principal plus all earned rewards with no penalties.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant={isUnlocked ? 'primary' : 'danger'}
            fullWidth
            size="lg"
            onClick={handleWithdraw}
            loading={isPending}
            disabled={isPending}
          >
            {isPending ? 'Withdrawing...' : isUnlocked ? 'Withdraw All' : 'Withdraw Early (with penalty)'}
          </Button>

          <Button variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UnstakeModal;
