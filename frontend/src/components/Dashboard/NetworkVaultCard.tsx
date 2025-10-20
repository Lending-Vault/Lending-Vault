import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { NetworkVaultData } from '../../hooks/useMultiNetworkVault';

interface NetworkVaultCardProps {
  data: NetworkVaultData;
  onDeposit: () => void;
  onBorrow: () => void;
  onWithdraw: () => void;
  isActiveNetwork: boolean;
}

const NetworkVaultCard: React.FC<NetworkVaultCardProps> = ({
  data,
  onDeposit,
  onBorrow,
  onWithdraw,
  isActiveNetwork,
}) => {
  const formatHealthFactor = (hf: string) => {
    const healthNum = parseFloat(hf);
    if (healthNum === 0 || isNaN(healthNum)) return '∞';
    if (healthNum > 1000) return '∞';
    return healthNum.toFixed(2);
  };

  const getHealthFactorColor = (hf: string) => {
    const healthNum = parseFloat(hf);
    if (healthNum === 0 || healthNum > 1000 || isNaN(healthNum)) return 'text-green-400';
    if (healthNum >= 2) return 'text-green-400';
    if (healthNum >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getChainColor = (chainName: string) => {
    if (chainName.includes('Lisk')) return 'from-lisk-500/20 to-lisk-600/20 border-lisk-500/30';
    if (chainName.includes('Ethereum')) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  const getChainBadgeColor = (chainName: string) => {
    if (chainName.includes('Lisk')) return 'bg-lisk-500/20 text-lisk-400 border-lisk-500/30';
    if (chainName.includes('Ethereum')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className={`relative rounded-xl bg-gradient-to-br ${getChainColor(data.chainName)} border backdrop-blur-sm p-6 lisk-glow-effect`}>
      {/* Chain Badge */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm font-medium ${getChainBadgeColor(data.chainName)}`}>
          {data.chainName}
        </div>
        {isActiveNetwork && (
          <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-medium">
            Connected
          </div>
        )}
      </div>

      {/* Loading State */}
      {data.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lisk-400"></div>
        </div>
      ) : (
        <>
          {/* Vault Stats */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {/* Collateral */}
            <div className="bg-dark-card/50 rounded-lg p-3 sm:p-4 border border-dark-border">
              <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Total Collateral</p>
              <p className="text-lg sm:text-2xl font-bold text-dark-text mobile-text-base">
                {parseFloat(data.collateral).toFixed(4)} ETH
              </p>
              <p className="text-xs sm:text-sm text-dark-textMuted mt-1 mobile-text-xs">
                ${(parseFloat(data.collateral) * 2000).toFixed(2)}
              </p>
            </div>

            {/* Debt */}
            <div className="bg-dark-card/50 rounded-lg p-3 sm:p-4 border border-dark-border">
              <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Total Debt</p>
              <p className="text-lg sm:text-2xl font-bold text-dark-text mobile-text-base">
                {parseFloat(data.debt).toFixed(4)} GMFOT
              </p>
              <p className="text-xs sm:text-sm text-dark-textMuted mt-1 mobile-text-xs">
                ${parseFloat(data.debt).toFixed(2)}
              </p>
            </div>

            {/* Health Factor */}
            <div className="bg-dark-card/50 rounded-lg p-3 sm:p-4 border border-dark-border">
              <p className="text-xs sm:text-sm text-dark-textMuted mb-1">Health Factor</p>
              <p className={`text-lg sm:text-2xl font-bold ${getHealthFactorColor(data.healthFactor)} mobile-text-base`}>
                {formatHealthFactor(data.healthFactor)}
              </p>
              <p className="text-xs text-dark-textMuted mt-1 mobile-text-xs">
                {parseFloat(data.healthFactor) < 1.5 && parseFloat(data.healthFactor) > 0
                  ? '⚠️ Low health - risk of liquidation'
                  : 'Healthy position'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={onDeposit}
              disabled={!isActiveNetwork}
              className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-sm ${
                isActiveNetwork
                  ? 'bg-lisk-500 hover:bg-lisk-600 text-white'
                  : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
              }`}
              title={!isActiveNetwork ? 'Switch to this network to deposit' : ''}
            >
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Deposit</span>
              <span className="sm:hidden">Dep</span>
            </button>
            <button
              onClick={onBorrow}
              disabled={!isActiveNetwork || parseFloat(data.collateral) === 0}
              className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-sm ${
                isActiveNetwork && parseFloat(data.collateral) > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
              }`}
              title={
                !isActiveNetwork
                  ? 'Switch to this network to borrow'
                  : parseFloat(data.collateral) === 0
                  ? 'Deposit collateral first'
                  : ''
              }
            >
              Borrow
            </button>
            <button
              onClick={onWithdraw}
              disabled={!isActiveNetwork || parseFloat(data.collateral) === 0}
              className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-sm ${
                isActiveNetwork && parseFloat(data.collateral) > 0
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
              }`}
              title={
                !isActiveNetwork
                  ? 'Switch to this network to withdraw'
                  : parseFloat(data.collateral) === 0
                  ? 'No collateral to withdraw'
                  : ''
              }
            >
              <span className="hidden sm:inline">Withdraw</span>
              <span className="sm:hidden">With</span>
            </button>
          </div>

          {/* Switch Network Hint */}
          {!isActiveNetwork && (
            <p className="text-xs text-center text-dark-textMuted mt-3">
              Switch your wallet to {data.chainName} to interact
            </p>
          )}
        </>
      )}

      {/* Error State */}
      {data.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">Error loading vault data</p>
        </div>
      )}
    </div>
  );
};

export default NetworkVaultCard;
