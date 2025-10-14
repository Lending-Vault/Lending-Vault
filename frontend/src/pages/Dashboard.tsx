// src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import StatsCard from '../components/Dashboard/StatsCard';
import HealthFactorCard from '../components/Dashboard/HealthFactorCard';
import ActionButtons from '../components/Dashboard/ActionButtons';
import TransactionHistory from '../components/Dashboard/TransactionHistory';
import DepositModal from '../components/Modals/DepositModal';
import BorrowModal from '../components/Modals/BorrowModal';
import RepayModal from '../components/Modals/RepayModal';
import WithdrawModal from '../components/Modals/WithdrawModal';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { mockUserPosition, mockTransactions, formatCurrency, formatNumber } from '../utils/mockData';
import type { ModalType } from '../types';

const Dashboard: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'lisk'>('ethereum');
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false); // NEW: Track wallet connection
  const [walletAddress, setWalletAddress] = useState<string>(''); // NEW: Store wallet address

  // Mock constants
  const ethPrice = 2000;
  const maxBorrowAmount = mockUserPosition.collateralBalance * 0.5;
  const borrowDate = new Date('2025-10-10');

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setIsWalletConnected(true);
    setWalletAddress('0x742d...5f3A'); // Mock address
    console.log('Wallet connected');
    // Integrator will implement real wallet connection
  };

  const handleDisconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    console.log('Wallet disconnected');
  };

  const handleOpenModal = (type: ModalType) => {
    setOpenModal(type);
    console.log(`Opening ${type} modal`);
  };

  const handleDeposit = (amount: number) => {
    console.log('Deposit:', amount);
  };

  const handleBorrow = (amount: number) => {
    console.log('Borrow:', amount);
  };

  const handleRepay = (amount: number) => {
    console.log('Repay:', amount);
  };

  const handleWithdraw = (amount: number) => {
    console.log('Withdraw:', amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-950/20 to-dark-bg pb-20 md:pb-0">
      
      {/* Header */}
      <Header
        onConnectWallet={handleConnectWallet}
        selectedChain={selectedChain}
        onChainChange={setSelectedChain}
        isConnected={isWalletConnected}
        walletAddress={walletAddress}
        onDisconnect={handleDisconnectWallet}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* If wallet NOT connected - Show Connect Prompt */}
        {!isWalletConnected ? (
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
                  Connect your wallet to start depositing, borrowing, and managing your crypto assets.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<Wallet className="w-5 h-5" />}
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </Button>

              <div className="mt-6 pt-6 border-t border-dark-border">
                <p className="text-sm text-dark-textMuted mb-3">Supported Networks:</p>
                <div className="flex gap-2 justify-center">
                  <span className="px-3 py-1 bg-dark-bg rounded-lg text-xs text-white">
                    Ethereum Sepolia
                  </span>
                  <span className="px-3 py-1 bg-dark-bg rounded-lg text-xs text-white">
                    Lisk Sepolia
                  </span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* If wallet IS connected - Show Dashboard */
          <>
            {/* Position Summary - 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Collateral Balance"
                value={formatCurrency(mockUserPosition.collateralBalance)}
                subtitle={`${formatNumber(mockUserPosition.collateralAmount)} ${mockUserPosition.collateralToken}`}
              />
              
              <StatsCard
                title="Debt Balance"
                value={formatCurrency(mockUserPosition.debtBalance)}
                subtitle={`${formatNumber(mockUserPosition.debtAmount)} ${mockUserPosition.debtToken}`}
              />
              
              <HealthFactorCard healthFactor={mockUserPosition.healthFactor} />
            </div>

            {/* Action Buttons - Hidden on mobile */}
            <div className="mb-8 hidden md:block">
              <ActionButtons onOpenModal={handleOpenModal} />
            </div>

            {/* Transaction History */}
            <TransactionHistory transactions={mockTransactions} />
          </>
        )}

      </main>

      {/* Bottom Navigation - Only show if wallet connected */}
      {isWalletConnected && <BottomNav onOpenModal={handleOpenModal} />}

      {/* Modals */}
      <DepositModal
        isOpen={openModal === 'deposit'}
        onClose={() => setOpenModal(null)}
        currentCollateral={mockUserPosition.collateralBalance}
        currentCollateralAmount={mockUserPosition.collateralAmount}
        tokenSymbol={mockUserPosition.collateralToken}
        tokenPrice={ethPrice}
        onDeposit={handleDeposit}
      />

      <BorrowModal
        isOpen={openModal === 'borrow'}
        onClose={() => setOpenModal(null)}
        collateralValue={mockUserPosition.collateralBalance}
        currentDebt={mockUserPosition.debtBalance}
        currentHealthFactor={mockUserPosition.healthFactor}
        maxBorrowAmount={maxBorrowAmount}
        interestRate={8}
        onBorrow={handleBorrow}
      />

      <RepayModal
        isOpen={openModal === 'repay'}
        onClose={() => setOpenModal(null)}
        currentDebt={mockUserPosition.debtBalance}
        debtToken={mockUserPosition.debtToken}
        interestRate={8}
        borrowDate={borrowDate}
        onRepay={handleRepay}
      />

      <WithdrawModal
        isOpen={openModal === 'withdraw'}
        onClose={() => setOpenModal(null)}
        currentCollateral={mockUserPosition.collateralBalance}
        currentCollateralAmount={mockUserPosition.collateralAmount}
        currentDebt={mockUserPosition.debtBalance}
        currentHealthFactor={mockUserPosition.healthFactor}
        tokenSymbol={mockUserPosition.collateralToken}
        tokenPrice={ethPrice}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
};

export default Dashboard;