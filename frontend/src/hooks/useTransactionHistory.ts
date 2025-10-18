// Hook to fetch real transaction history from contract events
import { useEffect, useState } from 'react';
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

  const { fromBlock = BigInt(0), maxTransactions = 50 } = options;

  useEffect(() => {
    if (!address || !publicClient || !contractAddresses?.VaultManager) {
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const vaultManagerAddress = contractAddresses.VaultManager as `0x${string}`;

        // Get the latest block number
        const latestBlock = await publicClient.getBlockNumber();

        // Fetch events (limit to last 10000 blocks to avoid rate limits)
        const startBlock = fromBlock > 0n ? fromBlock : latestBlock - 10000n;

        // Fetch all relevant events in parallel
        const [depositLogs, withdrawLogs, borrowLogs, repayLogs] = await Promise.all([
          // CollateralDeposited events
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'CollateralDeposited',
              inputs: [
                { type: 'address', indexed: true, name: '_sender' },
                { type: 'address', indexed: true, name: '_token' },
                { type: 'uint256', indexed: false, name: '_value' },
              ],
            },
            args: {
              _sender: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
          // CollateralWithdrawn events
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'CollateralWithdrawn',
              inputs: [
                { type: 'address', indexed: true, name: '_sender' },
                { type: 'address', indexed: true, name: '_token' },
                { type: 'uint256', indexed: false, name: '_value' },
              ],
            },
            args: {
              _sender: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
          // Borrowed events
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'Borrowed',
              inputs: [
                { type: 'address', indexed: true, name: '_borrower' },
                { type: 'address', indexed: true, name: '_token' },
                { type: 'uint256', indexed: false, name: '_amount' },
              ],
            },
            args: {
              _borrower: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
          // Repaid events
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: 'Repaid',
              inputs: [
                { type: 'address', indexed: true, name: '_borrower' },
                { type: 'address', indexed: true, name: '_token' },
                { type: 'uint256', indexed: false, name: '_amount' },
              ],
            },
            args: {
              _borrower: address,
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          }),
        ]);

        // Process all logs into Transaction objects
        const allTransactions: Transaction[] = [];

        // Process deposits
        for (const log of depositLogs) {
          const tx = await processLog(log, 'Deposit', publicClient);
          if (tx) allTransactions.push(tx);
        }

        // Process withdrawals
        for (const log of withdrawLogs) {
          const tx = await processLog(log, 'Withdraw', publicClient);
          if (tx) allTransactions.push(tx);
        }

        // Process borrows
        for (const log of borrowLogs) {
          const tx = await processLog(log, 'Borrow', publicClient);
          if (tx) allTransactions.push(tx);
        }

        // Process repays
        for (const log of repayLogs) {
          const tx = await processLog(log, 'Repay', publicClient);
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
  }, [address, chainId, publicClient, contractAddresses, fromBlock, maxTransactions]);

  return { transactions, isLoading, error, refetch: () => {} };
}

// Helper function to process a log into a Transaction
async function processLog(
  log: Log,
  type: 'Deposit' | 'Borrow' | 'Repay' | 'Withdraw' | 'Liquidation',
  publicClient: any
): Promise<Transaction | null> {
  try {
    // Check if transaction hash exists
    if (!log.transactionHash || !log.blockNumber) {
      return null;
    }

    // Get block to extract timestamp
    const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

    // Get transaction receipt for status
    const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash });

    // Parse the amount from log data (last 32 bytes)
    const amount = log.data ? BigInt(log.data) : 0n;

    // Format amount (assuming 18 decimals for ETH/tokens)
    const formattedAmount = formatUnits(amount, 18);

    // Determine token symbol from the indexed _token parameter
    const tokenAddress = log.topics[2]; // _token is the 2nd indexed parameter
    const tokenSymbol = tokenAddress === '0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ? 'ETH'
      : 'GMFOT'; // You could add more token mapping here

    // Format date
    const date = new Date(Number(block.timestamp) * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: log.transactionHash as string,
      type,
      amount: `${parseFloat(formattedAmount).toFixed(4)} ${tokenSymbol}`,
      date,
      status: receipt.status === 'success' ? 'Success' : 'Failed',
      txHash: `${log.transactionHash.slice(0, 6)}...${log.transactionHash.slice(-4)}`,
      fullTxHash: log.transactionHash as string,
      blockNumber: log.blockNumber as bigint,
    };
  } catch (err) {
    console.error('Error processing log:', err);
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
