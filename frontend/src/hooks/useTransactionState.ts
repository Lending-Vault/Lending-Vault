import { useState, useCallback } from 'react';
import type { Transaction } from '../types';

interface PendingTransaction {
  hash: string;
  type: Transaction['type'];
  amount: string;
  timestamp: number;
  chainId: number;
  network: string;
}

export function useTransactionState() {
  const [pendingTransactions, setPendingTransactions] = useState<Map<string, PendingTransaction>>(new Map());
  const [confirmedTransactions, setConfirmedTransactions] = useState<Transaction[]>([]);

  const addPendingTransaction = useCallback((
    hash: string,
    type: Transaction['type'],
    amount: string,
    chainId: number,
    network: string
  ) => {
    const pendingTx: PendingTransaction = {
      hash,
      type,
      amount,
      timestamp: Date.now(),
      chainId,
      network
    };
    
    setPendingTransactions(prev => new Map(prev).set(hash, pendingTx));
    
    // Create a temporary transaction object for immediate display
    const tempTransaction: Transaction = {
      id: `${chainId}-${hash}`,
      type,
      amount,
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Pending',
      txHash: `${hash.slice(0, 6)}...${hash.slice(-4)}`,
      fullTxHash: hash,
      timestamp: Date.now(),
      network: network as 'Lisk Sepolia' | 'Ethereum Sepolia',
      chainId,
    };
    
    setConfirmedTransactions(prev => [tempTransaction, ...prev]);
    
    return tempTransaction;
  }, []);

  const confirmTransaction = useCallback((
    hash: string,
    blockNumber: bigint,
    finalStatus: 'Success' | 'Failed' = 'Success'
  ) => {
    const pendingTx = pendingTransactions.get(hash);
    if (!pendingTx) return null;
    
    // Remove from pending
    setPendingTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(hash);
      return newMap;
    });
    
    // Update the transaction in confirmed list
    setConfirmedTransactions(prev => 
      prev.map(tx => 
        tx.fullTxHash === hash 
          ? {
              ...tx,
              status: finalStatus,
              blockNumber,
              date: new Date().toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : tx
      )
    );
    
    return pendingTx;
  }, [pendingTransactions]);

  const removeTransaction = useCallback((hash: string) => {
    setPendingTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(hash);
      return newMap;
    });
    
    setConfirmedTransactions(prev => prev.filter(tx => tx.fullTxHash !== hash));
  }, []);

  const clearPendingTransactions = useCallback(() => {
    setPendingTransactions(new Map());
  }, []);

  const mergeWithFetchedTransactions = useCallback((fetchedTransactions: Transaction[]) => {
    // Combine our state transactions with fetched ones, avoiding duplicates
    const existingHashes = new Set(fetchedTransactions.map(tx => tx.fullTxHash));
    const uniqueStateTransactions = confirmedTransactions.filter(
      tx => !existingHashes.has(tx.fullTxHash)
    );
    
    // Sort by timestamp (newest first)
    const allTransactions = [...uniqueStateTransactions, ...fetchedTransactions].sort((a, b) => {
      const timestampA = a.timestamp || Number(a.blockNumber || 0);
      const timestampB = b.timestamp || Number(b.blockNumber || 0);
      return timestampB - timestampA;
    });
    
    return allTransactions;
  }, [confirmedTransactions]);

  return {
    pendingTransactions,
    confirmedTransactions,
    addPendingTransaction,
    confirmTransaction,
    removeTransaction,
    clearPendingTransactions,
    mergeWithFetchedTransactions,
  };
}