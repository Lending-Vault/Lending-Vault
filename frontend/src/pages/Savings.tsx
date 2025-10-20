// src/pages/Savings.tsx
import React, { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, Lock, Clock, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import StakeModal from '../components/Modals/StakeModal';
import UnstakeModal from '../components/Modals/UnstakeModal';
import {
  useUserSavingsPositions,
  useProtocolStats,
  useTotalValueLocked,
  useGftRewards,
  formatSavingsPosition,
  getLockPeriodName,
  getDaysRemaining,
  type SavingsPosition,
} from '../hooks';
import { getContractAddresses } from '../config/contracts';
import type { ModalType } from '../types';

const Savings: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'lisk'>('lisk');
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [selectedPosition, setSelectedPosition] = useState<SavingsPosition | null>(null);
  const [selectedPositionIndex, setSelectedPositionIndex] = useState<number | null>(null);

  // Wagmi hooks for wallet connection
  const { isConnected, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  // Savings hooks
  const { positions, isLoading: positionsLoading, refetch: refetchPositions } = useUserSavingsPositions();
  const { stats } = useProtocolStats();
  // Use type assertion to access network-specific properties
  const mockUSDTAddress = (contractAddresses as any)?.MockUSDT || '';
  const { tvl } = useTotalValueLocked(mockUSDTAddress);
  const { quarterly, semiAnnual, annual } = useGftRewards();

  // Calculate total savings
  const totalSavings = positions?.reduce((acc, pos) => {
    if (!pos.withdrawn) {
      return acc + parseFloat(formatUnits(pos.principal, 18));
    }
    return acc;
  }, 0) || 0;

  const activePositionsCount = positions?.filter(pos => !pos.withdrawn).length || 0;

  const handleOpenStakeModal = () => {
    setOpenModal('stake');
  };

  const handleOpenUnstakeModal = (position: SavingsPosition, index: number) => {
    setSelectedPosition(position);
    setSelectedPositionIndex(index);
    setOpenModal('unstake');
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedPosition(null);
    setSelectedPositionIndex(null);
  };

  // Refetch positions when modal closes
  useEffect(() => {
    if (openModal === null) {
      refetchPositions();
    }
  }, [openModal, refetchPositions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-950/20 to-dark-bg pb-20 md:pb-0">
      {/* Header */}
      <Header
        selectedChain={selectedChain}
        onChainChange={setSelectedChain}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If wallet NOT connected - Show Connect Prompt */}
        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full text-center" padding="lg">
              <div className="mb-6">
                <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-10 h-10 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-dark-textMuted">
                  Connect your wallet to start earning interest on your stablecoins.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <Card padding="md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Total Savings</p>
                    <h3 className="text-lg sm:text-2xl font-bold text-white">
                      ${totalSavings.toFixed(2)}
                    </h3>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Active Positions</p>
                    <h3 className="text-lg sm:text-2xl font-bold text-white">
                      {activePositionsCount}
                    </h3>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-success-400" />
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Total TVL</p>
                    <h3 className="text-lg sm:text-2xl font-bold text-white truncate">
                      ${tvl ? formatUnits(tvl, 18) : '0'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-warning-400" />
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="w-full">
                    <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Total Users</p>
                    <h3 className="text-lg sm:text-2xl font-bold text-white">
                      {stats?.users ? stats.users.toString() : '0'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-info-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-info-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Stake Button */}
            <div className="mb-8">
              <Button
                onClick={handleOpenStakeModal}
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
              >
                <PiggyBank className="w-5 h-5 mr-2" />
                Stake Stablecoins
              </Button>
            </div>

            {/* Savings Positions */}
            <Card padding="lg">
              <h2 className="text-xl font-bold text-white mb-6">Your Savings Positions</h2>

              {positionsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto"></div>
                  <p className="text-dark-textMuted mt-4">Loading positions...</p>
                </div>
              ) : !positions || positions.length === 0 ? (
                <div className="text-center py-12">
                  <PiggyBank className="w-16 h-16 text-dark-textMuted mx-auto mb-4 opacity-50" />
                  <p className="text-dark-textMuted mb-4">No savings positions yet</p>
                  <Button onClick={handleOpenStakeModal} variant="primary" size="md">
                    Create Your First Position
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">Position</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">Lock Period</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">Interest</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">GFT Reward</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-dark-textMuted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position, index) => {
                          const formatted = formatSavingsPosition(position);
                          const daysRemaining = getDaysRemaining(position.lockEndTime);
                          const isUnlocked = formatted.isUnlocked;

                          return (
                            <tr
                              key={position.positionId.toString()}
                              className="border-b border-dark-border hover:bg-dark-hover transition-colors"
                            >
                              <td className="py-4 px-4">
                                <p className="text-white font-medium">#{formatted.positionId}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-white font-medium">${formatted.principal}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-white text-sm">{getLockPeriodName(position.lockPeriod)}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-success-400 font-medium">
                                  {formatted.stablecoinInterest === '0.0' ? 'N/A' : `$${formatted.stablecoinInterest}`}
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-warning-400 font-medium">{formatted.gftReward} GFT</p>
                              </td>
                              <td className="py-4 px-4">
                                {position.withdrawn ? (
                                  <span className="px-3 py-1 bg-dark-bg rounded-full text-xs text-dark-textMuted">
                                    Withdrawn
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="px-3 py-1 bg-success-500/10 text-success-400 rounded-full text-xs">
                                    Unlocked
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-warning-500/10 text-warning-400 rounded-full text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {daysRemaining}d left
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {!position.withdrawn && (
                                  <Button
                                    onClick={() => handleOpenUnstakeModal(position, index)}
                                    variant={isUnlocked ? 'primary' : 'secondary'}
                                    size="sm"
                                  >
                                    Withdraw
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {positions.map((position, index) => {
                      const formatted = formatSavingsPosition(position);
                      const daysRemaining = getDaysRemaining(position.lockEndTime);
                      const isUnlocked = formatted.isUnlocked;

                      return (
                        <div
                          key={position.positionId.toString()}
                          className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-dark-textMuted">Position #{formatted.positionId}</span>
                            {position.withdrawn ? (
                              <span className="px-3 py-1 bg-dark-bg rounded-full text-xs text-dark-textMuted">
                                Withdrawn
                              </span>
                            ) : isUnlocked ? (
                              <span className="px-3 py-1 bg-success-500/10 text-success-400 rounded-full text-xs">
                                Unlocked
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-warning-500/10 text-warning-400 rounded-full text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysRemaining}d left
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-dark-textMuted mb-1">Amount</p>
                              <p className="text-white font-semibold">${formatted.principal}</p>
                            </div>
                            <div>
                              <p className="text-xs text-dark-textMuted mb-1">Lock Period</p>
                              <p className="text-white font-medium text-sm">{getLockPeriodName(position.lockPeriod)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-dark-textMuted mb-1">Interest</p>
                              <p className="text-success-400 font-semibold text-sm">
                                {formatted.stablecoinInterest === '0.0' ? 'N/A' : `$${formatted.stablecoinInterest}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-dark-textMuted mb-1">GFT Reward</p>
                              <p className="text-warning-400 font-semibold text-sm">{formatted.gftReward} GFT</p>
                            </div>
                          </div>

                          {!position.withdrawn && (
                            <Button
                              onClick={() => handleOpenUnstakeModal(position, index)}
                              variant={isUnlocked ? 'primary' : 'secondary'}
                              size="md"
                              fullWidth
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </main>

      {/* Bottom Navigation - Only show if wallet connected */}
      {isConnected && <BottomNav onOpenModal={setOpenModal} />}

      {/* Modals */}
      <StakeModal
        isOpen={openModal === 'stake'}
        onClose={handleCloseModal}
        gftRewards={{ quarterly, semiAnnual, annual }}
      />

      <UnstakeModal
        isOpen={openModal === 'unstake'}
        onClose={handleCloseModal}
        position={selectedPosition}
        positionIndex={selectedPositionIndex}
      />
    </div>
  );
};

export default Savings;
