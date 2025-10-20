// Hook to fetch real transaction history from contract events
import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatUnits, type Log } from 'viem';
import { getContractAddresses } from '../config/contracts';
import type { Transaction } from '../types';

interface TransactionHistoryOptions {
  fromBlock?: bigint;
  maxTransactions?: number;
}

export function useTransactionHistory(options: TransactionHistoryOptions = {}) {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const contractAddresses = getContractAddresses(chainId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(0);

  const { fromBlock = BigInt(0), maxTransactions = 50 } = options;

  useEffect(() => {
    if (!address || !publicClient || !contractAddresses?.VaultManager) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const vaultManagerAddress = contractAddresses.VaultManager as `0x${string}`;

        // Get the latest block number
        const latestBlock = await publicClient.getBlockNumber();

        // Reduce block range to avoid RPC overload (1000 blocks instead of 10000)
        const startBlock = fromBlock > 0n ? fromBlock : latestBlock - 1000n;

        const [depositLogs, withdrawLogs, borrowLogs, repayLogs] = await Promise.all([
          // CollateralDeposited(address indexed user, address indexed token, uint256 amount)
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'CollateralDeposited',
              inputs: [
                { type: 'address', indexed: true, name: 'user' },
                { type: 'address', indexed: true, name: 'token' },
                { type: 'uint256', indexed: false, name: 'amount' },
              ],
            },
            args: {
              user: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
          // CollateralWithdrawn(address indexed user, address indexed token, uint256 amount)
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'CollateralWithdrawn',
              inputs: [
                { type: 'address', indexed: true, name: 'user' },
                { type: 'address', indexed: true, name: 'token' },
                { type: 'uint256', indexed: false, name: 'amount' },
              ],
            },
            args: {
              user: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
          // Borrowed(address indexed user, address indexed collateralToken, address indexed borrowToken, uint256 amount)
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'Borrowed',
              inputs: [
                { type: 'address', indexed: true, name: 'user' },
                { type: 'address', indexed: true, name: 'collateralToken' },
                { type: 'address', indexed: true, name: 'borrowToken' },
                { type: 'uint256', indexed: false, name: 'amount' },
              ],
            },
            args: {
              user: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
          // Repaid(address indexed user, address indexed token, uint256 amount)
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'Repaid',
              inputs: [
                { type: 'address', indexed: true, name: 'user' },
                { type: 'address', indexed: true, name: 'token' },
                { type: 'uint256', indexed: false, name: 'amount' },
              ],
            },
            args: {
              user: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
        ]);

        // Process all logs into Transaction objects (now synchronous - no RPC calls)
        const allTransactions: Transaction[] = [];

        // Process deposits (token at topics[2])
        for (const log of depositLogs) {
          const tx = processLog(log, 'Deposit', 2);
          if (tx) allTransactions.push(tx);
        }

        // Process withdrawals (token at topics[2])
        for (const log of withdrawLogs) {
          const tx = processLog(log, 'Withdraw', 2);
          if (tx) allTransactions.push(tx);
        }

        // Process borrows (borrowToken at topics[3])
        for (const log of borrowLogs) {
          const tx = processLog(log, 'Borrow', 3);
          if (tx) allTransactions.push(tx);
        }

        // Process repays (token at topics[2])
        for (const log of repayLogs) {
          const tx = processLog(log, 'Repay', 2);
          if (tx) allTransactions.push(tx);
        }

        // Sort by block number (newest first) and limit
        const sortedTxs = allTransactions
          .sort((a, b) => Number(b.blockNumber || 0) - Number(a.blockNumber || 0))
          .slice(0, maxTransactions);

        setTransactions(sortedTxs);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, chainId, publicClient, contractAddresses, fromBlock, maxTransactions, shouldRefetch]);

  // Refetch function (memoized to prevent infinite loops)
  const refetch = useCallback(() => {
    setShouldRefetch(prev => prev + 1);
  }, []);

  return { transactions, isLoading, error, refetch };
}

// Helper function to process a log into a Transaction (optimized - no extra RPC calls)
function processLog(
  log: Log,
  type: 'Deposit' | 'Borrow' | 'Repay' | 'Withdraw' | 'Liquidation',
  tokenTopicIndex: number = 2 // Default to topics[2] for most events
): Transaction | null {
  try {
    // Check if transaction hash exists
    if (!log.transactionHash || !log.blockNumber) {
      return null;
    }

    // Parse the amount from log data (last 32 bytes)
    const amount = log.data ? BigInt(log.data) : 0n;

    // Format amount (assuming 18 decimals for ETH/tokens)
    const formattedAmount = formatUnits(amount, 18);

    // Determine token symbol from the indexed token parameter
    // topics[0] = event signature hash
    // topics[1] = user address
    // topics[2] = token address (for Deposit/Withdraw/Repay)
    // topics[3] = borrowToken address (for Borrow only)
    const tokenAddress = log.topics[tokenTopicIndex]?.toLowerCase();

    // Check if it's NATIVE_ETH (case-insensitive comparison)
    const isNativeETH = tokenAddress?.includes('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    const tokenSymbol = isNativeETH ? 'ETH' : 'GMFOT';

    // Use simple date formatting (no need to fetch block timestamp - saves RPC calls)
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return {
      id: log.transactionHash as string,
      type,
      amount: `${parseFloat(formattedAmount).toFixed(4)} ${tokenSymbol}`,
      date,
      status: 'Success', // All mined logs are successful (no need to fetch receipt)
      txHash: `${log.transactionHash.slice(0, 6)}...${log.transactionHash.slice(-4)}`,
      fullTxHash: log.transactionHash as string,
      blockNumber: log.blockNumber as bigint,
    };
  } catch (err) {
    console.error('❌ Error processing log:', err);
    return null;
  }
}

// Helper to get block explorer URL
export function getBlockExplorerUrl(chainId: number | undefined, txHash: string): string {
  switch (chainId) {
    case 4202: // Lisk Sepolia
      return `https://sepolia-blockscout.lisk.com/tx/${txHash}`;
    case 11155111: // Ethereum Sepolia
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    default:
      return '#';
  }
}
