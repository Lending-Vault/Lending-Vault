// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import VaultCard from '../components/Dashboard/VaultCard';
import GMFOTCard from '../components/Dashboard/GMFOTCard';
import TransactionHistory from '../components/Dashboard/TransactionHistory';
import DepositModal from '../components/Modals/DepositModal';
import BorrowModal from '../components/Modals/BorrowModal';
import RepayModal from '../components/Modals/RepayModal';
import WithdrawModal from '../components/Modals/WithdrawModal';
import Card from '../components/UI/Card';
import { formatCurrency } from '../utils/mockData';
import type { ModalType } from '../types';
import {
  useUserCollateral,
  useUserDebt,
  useHealthFactor,
  useDepositETH,
  useBorrow,
  useRepay,
  useWithdrawETH,
  useTransactionHistory,
  NATIVE_ETH
} from '../hooks';
import { useTokenPrice } from '../hooks/useOracle';
import { getContractAddresses } from '../config/contracts';

const Dashboard: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'lisk'>('lisk');
  const [openModal, setOpenModal] = useState<ModalType>(null);

  // Wagmi hooks for wallet connection
  const { isConnected, chainId } = useAccount();
  const contractAddresses = getContractAddresses(chainId);

  // Contract hooks - using NATIVE_ETH for collateral
  const { collateral, refetch: refetchCollateral } = useUserCollateral(NATIVE_ETH as `0x${string}`);
  const { debt, refetch: refetchDebt } = useUserDebt(contractAddresses?.GMFOTToken as `0x${string}`);
  const { healthFactor, refetch: refetchHealthFactor } = useHealthFactor(
    NATIVE_ETH as `0x${string}`,
    contractAddresses?.GMFOTToken as `0x${string}`
  );
  const { depositETH, isSuccess: isDepositSuccess } = useDepositETH();
  const { borrow, isSuccess: isBorrowSuccess } = useBorrow();
  const { repay, isSuccess: isRepaySuccess } = useRepay();
  const { withdrawETH, isSuccess: isWithdrawSuccess } = useWithdrawETH();

  // Get ETH price from oracle
  const { price: ethPrice } = useTokenPrice(NATIVE_ETH as `0x${string}`);

  // Get real transaction history
  const { transactions, isLoading: txLoading } = useTransactionHistory();

  // Refetch vault data when transactions succeed
  useEffect(() => {
    if (isDepositSuccess || isBorrowSuccess || isRepaySuccess || isWithdrawSuccess) {
      refetchCollateral();
      refetchDebt();
      refetchHealthFactor();
    }
  }, [isDepositSuccess, isBorrowSuccess, isRepaySuccess, isWithdrawSuccess, refetchCollateral, refetchDebt, refetchHealthFactor]);

  // Refetch vault data when network changes
  useEffect(() => {
    if (chainId && isConnected) {
      console.log('🔄 Network changed to:', chainId, 'Refetching vault data...');
      refetchCollateral();
      refetchDebt();
      refetchHealthFactor();
    }
  }, [chainId, isConnected, refetchCollateral, refetchDebt, refetchHealthFactor]);

  // Parse collateral and debt data
  const collateralAmount = collateral && typeof collateral === 'bigint'
    ? formatUnits(collateral, 18) : '0';
  const debtAmount = debt && typeof debt === 'bigint'
    ? formatUnits(debt, 18) : '0';

  // Calculate USD values for ETH (main collateral)
  const ethPriceNum = ethPrice && typeof ethPrice === 'bigint'
    ? parseFloat(formatUnits(ethPrice, 8)) : 2000;
  const collateralBalance = parseFloat(collateralAmount) * ethPriceNum;
  const debtBalance = parseFloat(debtAmount); // Assuming GMFOT is $1
  const collateralPriceNum = ethPriceNum; // For modal compatibility

  // Health factor is returned as basis points (10000 = 100%)
  // Convert to percentage: divide by 100 (10000 basis points = 100%)
  // Special case: type(uint256).max means infinite (no debt)
  const healthFactorValue = (() => {
    if (!healthFactor || typeof healthFactor !== 'bigint') return 0;

    // Check if it's the max uint256 value (returned when debt is 0)
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    if (healthFactor >= maxUint256 / BigInt(1000)) {
      // If health factor is very large (approaching max uint256), treat as infinite/healthy
      return 999; // Display as 999% (effectively infinite)
    }

    return Number(healthFactor) / 100; // Divide by 100 to get percentage (e.g., 15000 -> 150%)
  })();

  // Calculate max borrow amount (50% of collateral value)
  const maxBorrowAmount = collateralBalance * 0.5;

  // Mock data for test tokens (these would come from separate vault calls in production)
  const ethSepoliaCollateral = collateralBalance * 0.6; // 60% of total in ETH Sepolia
  const liskSepoliaCollateral = collateralBalance * 0.4; // 40% of total in Lisk Sepolia

  const borrowDate = new Date('2025-10-10');

  const handleOpenModal = (type: ModalType) => {
    setOpenModal(type);
    console.log(`Opening ${type} modal`);
  };

  const handleDeposit = async (amount: number) => {
    try {
      console.log('🔄 Starting deposit...', {
        amount,
        chainId,
        vaultManager: contractAddresses?.VaultManager,
        isConnected,
      });

      if (!contractAddresses?.VaultManager) {
        throw new Error('VaultManager address not found. Please check your network connection.');
      }

      const result = await depositETH(amount.toString());
      console.log('✅ Deposit transaction submitted:', result);

    } catch (error: any) {
      console.error('❌ Deposit error:', {
        message: error?.message,
        code: error?.code,
        details: error,
      });

      // User-friendly error messages
      if (error?.message?.includes('User rejected')) {
        console.log('ℹ️ User cancelled the transaction');
      } else if (error?.message?.includes('insufficient funds')) {
        console.error('💰 Insufficient ETH balance for transaction + gas');
      } else {
        console.error('⚠️ Unknown error occurred. Check console for details.');
      }
    }
  };

  const handleBorrow = async (amount: number) => {
    try {
      if (!contractAddresses?.GMFOTToken) {
        console.error('GMFOTToken address not found for current network');
        return;
      }
      console.log('Borrow:', amount);
      await borrow(
        contractAddresses.GMFOTToken as `0x${string}`,
        amount.toString(),
        18
      );
    } catch (error) {
      console.error('Borrow error:', error);
    }
  };

  const handleRepay = async (amount: number) => {
    try {
      if (!contractAddresses?.GMFOTToken) {
        console.error('GMFOTToken address not found for current network');
        return;
      }
      console.log('Repay:', amount);
      await repay(
        contractAddresses.GMFOTToken as `0x${string}`,
        amount.toString(),
        18
      );
    } catch (error) {
      console.error('Repay error:', error);
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      console.log('Withdraw ETH:', amount);
      await withdrawETH(amount.toString());
    } catch (error) {
      console.error('Withdraw error:', error);
    }
  };

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
                <p className="text-dark-textMuted mb-4">
                  Connect your wallet to start depositing collateral and borrowing GMFOT stablecoin.
                </p>
                <div className="bg-dark-bg/50 rounded-lg p-4 text-left space-y-2 text-sm text-dark-textMuted">
                  <p>✓ <span className="text-white font-semibold">No token approvals</span> - deposit native ETH directly</p>
                  <p>✓ <span className="text-white font-semibold">Multi-chain support</span> - works on Ethereum & Lisk Sepolia</p>
                  <p>✓ <span className="text-white font-semibold">Non-custodial</span> - you always control your funds</p>
                  <p>✓ <span className="text-white font-semibold">Transparent pricing</span> - oracle-based real-time rates</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-dark-border">
                <p className="text-sm text-dark-textMuted mb-3">Supported Networks:</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <span className="px-4 py-2 bg-dark-bg rounded-lg text-xs text-white border border-dark-border">
                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Ethereum Sepolia
                  </span>
                  <span className="px-4 py-2 bg-dark-bg rounded-lg text-xs text-white border border-dark-border">
                    <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                    Lisk Sepolia
                  </span>
                </div>
                <p className="text-xs text-dark-textMuted mt-4">
                  Need testnet ETH? Get free Sepolia ETH from faucets to try the protocol.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          /* If wallet IS connected - Show Dashboard */
          <>
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your Vaults</h1>
              <p className="text-dark-textMuted">Deposit native Sepolia ETH as collateral and borrow GMFOT stablecoin across multiple networks</p>
            </div>

            {/* How It Works - Info Banner */}
            <Card padding="lg" className="mb-6 bg-gradient-to-r from-primary-500/10 to-primary-600/5 border-primary-500/30">
              <div className="flex items-start gap-4">
                <div className="bg-primary-500/20 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">How Lending Vault Works</h3>
                  <div className="space-y-2 text-sm text-dark-textMuted">
                    <p>
                      <span className="font-semibold text-primary-400">1. Deposit Collateral:</span> Deposit native Sepolia ETH directly from your wallet (no token approval needed!)
                    </p>
                    <p>
                      <span className="font-semibold text-primary-400">2. Borrow GMFOT:</span> Borrow up to 50% of your collateral value in GMFOT stablecoin at 8% APR
                    </p>
                    <p>
                      <span className="font-semibold text-primary-400">3. Maintain Health:</span> Keep your Health Factor above 150% to avoid liquidation
                    </p>
                    <p>
                      <span className="font-semibold text-primary-400">4. Repay & Withdraw:</span> Repay your loan anytime and withdraw your collateral
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-dark-bg/50 rounded-lg border border-primary-500/20">
                    <p className="text-xs text-primary-300">
                      <span className="font-semibold">💡 Pro Tip:</span> Start by depositing a small amount of ETH to test the system. Your collateral is secured on-chain and you maintain full control.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Overall Portfolio Summary */}
            <Card padding="lg" className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Portfolio Overview</h2>
                <TrendingUp className="w-6 h-6 text-primary-400" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="group relative">
                  <p className="text-xs text-dark-textMuted mb-1">Total Collateral</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(collateralBalance)}</p>
                  <div className="hidden group-hover:block absolute z-10 bottom-full mb-2 w-48 p-2 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs text-dark-textMuted">
                    Your deposited Sepolia ETH across all networks
                  </div>
                </div>
                <div className="group relative">
                  <p className="text-xs text-dark-textMuted mb-1">Total Debt</p>
                  <p className="text-xl font-bold text-warning-400">{formatCurrency(debtBalance)}</p>
                  <div className="hidden group-hover:block absolute z-10 bottom-full mb-2 w-48 p-2 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs text-dark-textMuted">
                    Amount of GMFOT you've borrowed (accrues 8% APR interest)
                  </div>
                </div>
                <div className="group relative">
                  <p className="text-xs text-dark-textMuted mb-1">Health Factor</p>
                  <p className={`text-xl font-bold ${healthFactorValue >= 200 ? 'text-success-400' : healthFactorValue >= 150 ? 'text-warning-400' : 'text-danger-400'}`}>
                    {healthFactorValue > 0 ? healthFactorValue.toFixed(0) + '%' : 'N/A'}
                  </p>
                  <div className="hidden group-hover:block absolute z-10 bottom-full mb-2 w-56 p-2 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs text-dark-textMuted">
                    Ratio of collateral to debt. Below 150% = liquidation risk. Above 200% = safe. 999% = no debt (infinite health)
                  </div>
                </div>
                <div className="group relative">
                  <p className="text-xs text-dark-textMuted mb-1">Available to Borrow</p>
                  <p className="text-xl font-bold text-primary-400">{formatCurrency(maxBorrowAmount)}</p>
                  <div className="hidden group-hover:block absolute z-10 bottom-full mb-2 w-48 p-2 bg-dark-card border border-dark-border rounded-lg shadow-lg text-xs text-dark-textMuted">
                    Maximum GMFOT you can borrow (50% of collateral value - current debt)
                  </div>
                </div>
              </div>
            </Card>

            {/* Vault Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* ETH Sepolia Vault */}
              <VaultCard
                tokenName="Ethereum"
                tokenSymbol="ETH"
                network="Ethereum Sepolia"
                collateralBalance={ethSepoliaCollateral}
                collateralAmount={parseFloat(collateralAmount) * 0.6}
                tokenPrice={ethPriceNum}
                healthFactor={healthFactorValue}
                onDeposit={() => handleOpenModal('deposit')}
                onWithdraw={() => handleOpenModal('withdraw')}
                isConnected={isConnected}
              />

              {/* Lisk Sepolia Vault */}
              <VaultCard
                tokenName="Ethereum"
                tokenSymbol="ETH"
                network="Lisk Sepolia"
                collateralBalance={liskSepoliaCollateral}
                collateralAmount={parseFloat(collateralAmount) * 0.4}
                tokenPrice={ethPriceNum}
                healthFactor={healthFactorValue}
                onDeposit={() => handleOpenModal('deposit')}
                onWithdraw={() => handleOpenModal('withdraw')}
                isConnected={isConnected}
              />
            </div>

            {/* GMFOT Token Card */}
            <div className="mb-8">
              <GMFOTCard
                totalBorrowed={debtBalance + 5000} // Mock total borrowed (current + repaid)
                totalRepaid={5000} // Mock total repaid
                currentDebt={debtBalance}
                interestRate={8}
                onBorrow={() => handleOpenModal('borrow')}
                onRepay={() => handleOpenModal('repay')}
                isConnected={isConnected}
              />
            </div>

            {/* Transaction History */}
            <TransactionHistory transactions={transactions} isLoading={txLoading} />
          </>
        )}

      </main>

      {/* Bottom Navigation - Only show if wallet connected */}
      {isConnected && <BottomNav onOpenModal={handleOpenModal} />}

      {/* Modals */}
      <DepositModal
        isOpen={openModal === 'deposit'}
        onClose={() => setOpenModal(null)}
        currentCollateral={collateralBalance}
        currentCollateralAmount={parseFloat(collateralAmount)}
        tokenSymbol="ETH"
        tokenPrice={collateralPriceNum}
        onDeposit={handleDeposit}
      />

      <BorrowModal
        isOpen={openModal === 'borrow'}
        onClose={() => setOpenModal(null)}
        collateralValue={collateralBalance}
        currentDebt={debtBalance}
        currentHealthFactor={healthFactorValue}
        maxBorrowAmount={maxBorrowAmount}
        interestRate={8}
        onBorrow={handleBorrow}
      />

      <RepayModal
        isOpen={openModal === 'repay'}
        onClose={() => setOpenModal(null)}
        currentDebt={debtBalance}
        debtToken="GMFOT"
        interestRate={8}
        borrowDate={borrowDate}
        onRepay={handleRepay}
      />

      <WithdrawModal
        isOpen={openModal === 'withdraw'}
        onClose={() => setOpenModal(null)}
        currentCollateral={collateralBalance}
        currentCollateralAmount={parseFloat(collateralAmount)}
        currentDebt={debtBalance}
        currentHealthFactor={healthFactorValue}
        tokenSymbol="ETH"
        tokenPrice={collateralPriceNum}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
};

export default Dashboard;