// src/types/index.ts

export interface UserPosition {
  collateralBalance: number;      // USD value
  collateralAmount: number;        // Token amount (e.g., 5 ETH)
  collateralToken: string;         // Token symbol (ETH, WETH)
  debtBalance: number;             // USD value
  debtAmount: number;              // Token amount
  debtToken: string;               // USDT or USDC
  healthFactor: number;            // Percentage (e.g., 333)
}

export interface Transaction {
  id: number | string;
  type: 'Deposit' | 'Borrow' | 'Repay' | 'Withdraw' | 'Liquidation';
  amount: string;
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
  txHash: string;
  fullTxHash?: string; // Full transaction hash for block explorer
  blockNumber?: bigint; // Block number for sorting
}

export type ModalType = 'deposit' | 'borrow' | 'repay' | 'withdraw' | 'stake' | 'unstake' | null;