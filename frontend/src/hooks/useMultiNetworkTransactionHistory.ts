// Hook to fetch transaction history from BOTH networks simultaneously
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, type Log, createPublicClient, http, type PublicClient } from 'viem';
import { getContractAddresses } from '../config/contracts';
import { liskSepolia, sepolia } from 'wagmi/chains';
import type { Transaction } from '../types';

interface TransactionHistoryOptions {
  fromBlock?: bigint;
  maxTransactions?: number;
}

export function useMultiNetworkTransactionHistory(options: TransactionHistoryOptions = {}) {
  const { address } = useAccount();

  const liskClient = useMemo(
    () =>
      createPublicClient({
        chain: liskSepolia,
        transport: http(import.meta.env.VITE_LISK_SEPOLIA_RPC_URL || liskSepolia.rpcUrls.default.http[0]),
      }) as PublicClient,
    []
  );

  const ethClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(import.meta.env.VITE_SEPOLIA_RPC_URL || sepolia.rpcUrls.default.http[0]),
      }) as PublicClient,
    []
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(0);

  const { fromBlock = BigInt(0), maxTransactions = 50 } = options;

  const refetch = useCallback(() => setShouldRefetch(prev => prev + 1), []);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }

    const fetchAllTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [liskTxs, ethTxs] = await Promise.allSettled([
          fetchNetworkTransactions(liskClient, liskSepolia.id, 'Lisk Sepolia', address, fromBlock),
          fetchNetworkTransactions(ethClient, sepolia.id, 'Ethereum Sepolia', address, fromBlock),
        ]);

        const allTxs = [
          ...(liskTxs.status === 'fulfilled' ? liskTxs.value : []),
          ...(ethTxs.status === 'fulfilled' ? ethTxs.value : []),
        ].sort((a, b) => Number(b.blockNumber || 0) - Number(a.blockNumber || 0));

        setTransactions(allTxs.slice(0, maxTransactions));
      } catch (err) {
        console.error('Transaction fetch failed:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTransactions();
  }, [address, fromBlock, maxTransactions, shouldRefetch, liskClient, ethClient]);

  return { transactions, isLoading, error, refetch };
}

// Deployment blocks (VaultManager deployed)
const DEPLOYMENT_BLOCKS: Record<number, bigint> = {
  4202: 27692365n, // Lisk Sepolia
  11155111: 9430618n, // Ethereum Sepolia
};

async function fetchNetworkTransactions(
  publicClient: PublicClient,
  chainId: number,
  networkName: string,
  userAddress: `0x${string}`,
  fromBlock: bigint
): Promise<Transaction[]> {
  try {
    const contractAddresses = getContractAddresses(chainId);
    const vaultManagerAddress = contractAddresses?.VaultManager as `0x${string}`;
    if (!vaultManagerAddress) return [];

    const latestBlock = await publicClient.getBlockNumber();
    const startBlock = fromBlock > 0n ? fromBlock : DEPLOYMENT_BLOCKS[chainId] || 0n;

    const events = [
      { name: 'CollateralDeposited', type: 'Deposit' },
      { name: 'CollateralWithdrawn', type: 'Withdraw' },
      { name: 'Borrowed', type: 'Borrow' },
      { name: 'Repaid', type: 'Repay' },
    ];

    // Maximum block range per request
    // Lisk Sepolia: 100,000 blocks
    // Ethereum Sepolia (PublicNode): 50,000 blocks (much more generous than Alchemy's 10 block limit)
    const MAX_BLOCK_RANGE = chainId === 4202 ? 100000n : 50000n; // Use 50,000 for Ethereum Sepolia with PublicNode
    
    // Check if we need to chunk the request
    const totalBlockRange = latestBlock - startBlock;
    
    if (totalBlockRange <= MAX_BLOCK_RANGE) {
      // If within limit, use the original approach
      const logsPerEvent = await Promise.all(
        events.map(e =>
          publicClient.getLogs({
            address: vaultManagerAddress,
            event: {
              type: 'event',
              name: e.name,
              inputs: [
                { type: 'address', indexed: true, name: 'user' },
                { type: 'address', indexed: true, name: 'token' },
                { type: 'uint256', indexed: false, name: 'amount' },
              ],
            },
            fromBlock: startBlock,
            toBlock: latestBlock,
          })
        )
      );

      return await processLogs(logsPerEvent, events, publicClient, userAddress, chainId, networkName);
    } else {
      // Need to chunk the request
      console.log(`Block range ${totalBlockRange} exceeds limit, chunking requests for ${networkName}`);
      
      const allLogs: Log[][] = [];
      
      // Calculate chunk ranges
      const chunkCount = Math.ceil(Number(totalBlockRange) / Number(MAX_BLOCK_RANGE));
      
      for (let i = 0; i < chunkCount; i++) {
        const chunkFromBlock = startBlock + (BigInt(i) * MAX_BLOCK_RANGE);
        const chunkToBlock = i === chunkCount - 1
          ? latestBlock
          : chunkFromBlock + MAX_BLOCK_RANGE - 1n;
          
        // Retry logic for failed chunks
        let retryCount = 0;
        const maxRetries = 3;
        let chunkSuccess = false;
        
        while (retryCount < maxRetries && !chunkSuccess) {
          try {
            const chunkLogs = await Promise.all(
              events.map(e =>
                publicClient.getLogs({
                  address: vaultManagerAddress,
                  event: {
                    type: 'event',
                    name: e.name,
                    inputs: [
                      { type: 'address', indexed: true, name: 'user' },
                      { type: 'address', indexed: true, name: 'token' },
                      { type: 'uint256', indexed: false, name: 'amount' },
                    ],
                  },
                  fromBlock: chunkFromBlock,
                  toBlock: chunkToBlock,
                })
              )
            );
            
            // Add chunk logs to our collection
            if (i === 0) {
              // Initialize the array with the first chunk
              events.forEach((_, index) => {
                allLogs[index] = chunkLogs[index];
              });
            } else {
              // Append subsequent chunks
              events.forEach((_, index) => {
                allLogs[index] = [...allLogs[index], ...chunkLogs[index]];
              });
            }
            
            console.log(`Fetched chunk ${i + 1}/${chunkCount} for ${networkName} (blocks ${chunkFromBlock} to ${chunkToBlock})`);
            chunkSuccess = true;
          } catch (chunkError) {
            retryCount++;
            console.error(`Failed to fetch chunk ${i + 1} for ${networkName} (attempt ${retryCount}/${maxRetries}):`, chunkError);
            
            if (retryCount < maxRetries) {
              // Exponential backoff: wait 1s, 2s, 4s between retries
              const delayMs = 1000 * Math.pow(2, retryCount - 1);
              console.log(`Retrying in ${delayMs}ms...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
              console.error(`Max retries exceeded for chunk ${i + 1}, skipping...`);
              // Continue with other chunks even if this one fails
            }
          }
        }
      }
      
      return await processLogs(allLogs, events, publicClient, userAddress, chainId, networkName);
    }
  } catch (error) {
    console.error(`Failed fetching ${networkName} transactions:`, error);
    return [];
  }
}

async function processLogs(
  logsPerEvent: Log[][],
  events: { name: string; type: string }[],
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  chainId: number,
  networkName: string
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];

  for (let i = 0; i < logsPerEvent.length; i++) {
    const { type } = events[i];
    for (const log of logsPerEvent[i]) {
      const topicUser = log.topics[1];
      if (!topicUser) continue;
      const cleanUser = `0x${topicUser.slice(-40)}`.toLowerCase();
      if (cleanUser !== userAddress.toLowerCase()) continue;

      const tx = await processLog(publicClient, log, type as Transaction['type'], chainId, networkName);
      if (tx) allTransactions.push(tx);
    }
  }

  return allTransactions;
}

async function processLog(
  publicClient: PublicClient,
  log: Log,
  type: 'Deposit' | 'Borrow' | 'Repay' | 'Withdraw'| 'Liquidation',
  chainId: number,
  networkName: string
): Promise<Transaction | null> {
  try {
    if (!log.transactionHash || !log.blockNumber) return null;

    const amount = log.data ? safeParseBigInt(log.data) : 0n;
    const formattedAmount = formatUnits(amount, 18);
    const tokenAddress = log.topics[2]?.toLowerCase();
    const isNativeETH = tokenAddress?.includes('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    const tokenSymbol = isNativeETH ? 'ETH' : 'GMFOT';

    const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
    const timestamp = Number(block.timestamp) * 1000;
    const date = new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: `${chainId}-${log.transactionHash}`,
      type,
      amount: `${parseFloat(formattedAmount).toFixed(4)} ${tokenSymbol}`,
      date,
      status: 'Success',
      txHash: `${log.transactionHash.slice(0, 6)}...${log.transactionHash.slice(-4)}`,
      fullTxHash: log.transactionHash,
      blockNumber: log.blockNumber,
      network: networkName as 'Lisk Sepolia' | 'Ethereum Sepolia',
      chainId,
    };
  } catch (err) {
    console.error('Error processing log:', err);
    return null;
  }
}

function safeParseBigInt(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

export function getBlockExplorerUrl(chainId: number | undefined, txHash: string): string {
  switch (chainId) {
    case 4202:
      return `https://sepolia-blockscout.lisk.com/tx/${txHash}`;
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    default:
      return '#';
  }
}
