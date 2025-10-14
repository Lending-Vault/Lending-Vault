// src/utils/mockData.ts
import type { UserPosition, Transaction } from '../types';

export const mockUserPosition: UserPosition = {
  collateralBalance: 10000,
  collateralAmount: 5,
  collateralToken: 'ETH',
  debtBalance: 3000,
  debtAmount: 3000,
  debtToken: 'USDT',
  healthFactor: 333, // (10000 / 3000) * 100
};

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: 'Deposit',
    amount: '5 ETH',
    date: '2025-10-10 14:32',
    status: 'Success',
    txHash: '0x1234...5678',
  },
  {
    id: 2,
    type: 'Borrow',
    amount: '3,000 USDT',
    date: '2025-10-10 14:35',
    status: 'Success',
    txHash: '0xabcd...efgh',
  },
  {
    id: 3,
    type: 'Repay',
    amount: '500 USDT',
    date: '2025-10-11 09:15',
    status: 'Success',
    txHash: '0x9876...5432',
  },
];

// Helper to get health factor status
export const getHealthFactorStatus = (healthFactor: number): {
  color: string;
  bgColor: string;
  label: string;
} => {
  if (healthFactor >= 200) {
    return {
      color: 'text-success-500',
      bgColor: 'bg-success-500/10',
      label: 'Safe',
    };
  }
  if (healthFactor >= 150) {
    return {
      color: 'text-warning-500',
      bgColor: 'bg-warning-500/10',
      label: 'Warning',
    };
  }
  return {
    color: 'text-danger-500',
    bgColor: 'bg-danger-500/10',
    label: 'At Risk',
  };
};

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format number with decimals
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};