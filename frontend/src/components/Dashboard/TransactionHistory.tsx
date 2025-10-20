// src/components/Dashboard/TransactionHistory.tsx
import React from 'react';
import { ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import Card from '../UI/Card';
import type { Transaction } from '../../types';
import { getBlockExplorerUrl } from '../../hooks';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, isLoading = false }) => {
  const { chainId } = useAccount();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-warning-500" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-danger-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'text-success-500 bg-success-500/10';
      case 'Pending':
        return 'text-warning-500 bg-warning-500/10';
      case 'Failed':
        return 'text-danger-500 bg-danger-500/10';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Transaction History</h2>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-dark-textMuted">Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-dark-textMuted">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-dark-textMuted">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-dark-textMuted">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-dark-textMuted">Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-dark-border/50 hover:bg-dark-cardHover transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-white font-medium">{tx.type}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-white">{tx.amount}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-dark-textMuted text-sm">{tx.date}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                    {getStatusIcon(tx.status)}
                    {tx.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <a
                    href={getBlockExplorerUrl(chainId, (tx as any).fullTxHash || tx.txHash)}
                    className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm font-mono"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tx.txHash}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-semibold mb-1">{tx.type}</p>
                <p className="text-dark-textMuted text-xs">{tx.date}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                {getStatusIcon(tx.status)}
                {tx.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dark-border">
              <div>
                <p className="text-xs text-dark-textMuted mb-1">Amount</p>
                <p className="text-white font-medium">{tx.amount}</p>
              </div>
              <a
                href={getBlockExplorerUrl(chainId, (tx as any).fullTxHash || tx.txHash)}
                className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-xs font-mono"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx.txHash}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          <p className="text-dark-textMuted mt-4">Loading transactions...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-textMuted">No transactions yet</p>
          <p className="text-sm text-dark-textMuted mt-2">Your transaction history will appear here</p>
        </div>
      )}
    </Card>
  );
};

export default TransactionHistory;