# SavingsVault Integration Guide

This document outlines the complete integration of the SavingsVault contract with the LiquidVault frontend.

## Overview

The SavingsVault integration allows users to:
- Stake stablecoins (USDT, USDC) with lock periods (3, 6, or 12 months)
- Earn stablecoin interest (2% APY for annual lock)
- Earn GFT token rewards based on lock period
- View and manage their savings positions
- Withdraw funds (with penalties for early withdrawal)

## Contract Details

**Contract Address:** `0x6a476E9804Fe0146E639E734376a1fbDfC3Ca222` (Lisk Sepolia)

**Supported Stablecoins:**
- MockUSDT: `0x4261fE8B70819821c672D5a41d694A43515dB711`
- MockUSDC: `0xB190293101976937fb150aB19cB436450AA63762`

**Lock Periods:**
- Quarterly (3 months / 90 days)
- Semi-Annual (6 months / 180 days)
- Annual (12 months / 365 days)

**Rewards:**
- Quarterly: GFT token rewards only
- Semi-Annual: GFT token rewards only
- Annual: 2% stablecoin interest + GFT token rewards

**Early Withdrawal Penalty:** 10% (configurable by owner)

## Files Created/Modified

### New Files Created

#### Hooks
- **`frontend/src/hooks/useSavingsVault.ts`** - Complete set of hooks for SavingsVault interaction
  - `useUserSavingsPositions()` - Get user's savings positions
  - `useUserActivePositionsCount()` - Get count of active positions
  - `useTotalValueLocked()` - Get TVL for a stablecoin
  - `useProtocolStats()` - Get protocol statistics
  - `useIsSupportedStablecoin()` - Check if stablecoin is supported
  - `useMinimumDeposit()` - Get minimum deposit amount
  - `useEarlyWithdrawalPenalty()` - Get penalty percentage
  - `useGftRewards()` - Get GFT rewards for all lock periods
  - `useDepositSavings()` - Deposit stablecoins
  - `useWithdrawSavings()` - Withdraw savings
  - Utility functions for formatting and calculations

#### Pages
- **`frontend/src/pages/Savings.tsx`** - Main Savings page component
  - Displays savings overview (Total Savings, Active Positions, TVL, Total Users)
  - Shows all user positions in a table with details
  - Manages stake/unstake modals
  - Handles position refetching after transactions

#### Modals
- **`frontend/src/components/Modals/StakeModal.tsx`** - Staking modal
  - Amount input with max button
  - Lock period selection (3, 6, 12 months)
  - Rewards preview
  - Token approval flow
  - Validation for minimum deposit and balance

- **`frontend/src/components/Modals/UnstakeModal.tsx`** - Unstaking modal
  - Position details display
  - Early withdrawal warning with penalty calculation
  - Withdrawal summary showing principal, interest, and GFT rewards
  - Visual indicators for locked vs unlocked positions

#### ABIs
- **`frontend/src/abis/SavingsVault.json`** - Complete ABI for SavingsVault contract

### Modified Files

#### Core Application
- **`frontend/src/App.tsx`**
  - Added `react-router-dom` routing
  - Created routes for Dashboard (`/`) and Savings (`/savings`)

#### Navigation
- **`frontend/src/components/Layout/Header.tsx`**
  - Added navigation links (Dashboard, Savings) visible when wallet connected
  - Active route highlighting

- **`frontend/src/components/Layout/BottomNav.tsx`**
  - Added Dashboard and Savings navigation buttons for mobile
  - Grid expanded from 4 to 6 columns
  - Active route highlighting

#### Types
- **`frontend/src/types/index.ts`**
  - Extended `ModalType` to include `'stake'` and `'unstake'`

#### Hooks Export
- **`frontend/src/hooks/index.ts`**
  - Exported all SavingsVault hooks and utilities

#### Configuration
- **`frontend/src/config/contracts.ts`** (already contained SavingsVault address)
  - Verified SavingsVault address is present

#### Dependencies
- **`frontend/package.json`**
  - Added `react-router-dom: ^7.9.4`

## Usage

### 1. Staking Stablecoins

```typescript
import { useDepositSavings, LockPeriod } from '../hooks';

const { deposit, isPending, isSuccess } = useDepositSavings();

// Stake 1000 USDT for 12 months
await deposit(
  '0x4261fE8B70819821c672D5a41d694A43515dB711', // USDT address
  '1000', // Amount
  18, // Decimals
  LockPeriod.ANNUAL // Lock period
);
```

### 2. Viewing Positions

```typescript
import { useUserSavingsPositions } from '../hooks';

const { positions, isLoading, refetch } = useUserSavingsPositions();

// positions will be an array of SavingsPosition objects
positions?.map(position => {
  console.log('Position ID:', position.positionId);
  console.log('Principal:', position.principal);
  console.log('Lock End Time:', position.lockEndTime);
});
```

### 3. Withdrawing

```typescript
import { useWithdrawSavings } from '../hooks';

const { withdraw, isPending, isSuccess } = useWithdrawSavings();

// Withdraw position at index 0
await withdraw(0);
```

## Key Features

### Approval Flow
1. User enters stake amount and selects lock period
2. If allowance is insufficient, user approves tokens first
3. After approval, user confirms the stake transaction
4. Position is created and displayed in the positions table

### Position Management
- Each position shows:
  - Position ID
  - Principal amount
  - Lock period
  - Expected interest and GFT rewards
  - Status (Withdrawn, Unlocked, or days remaining)
  - Withdraw button

### Early Withdrawal Penalties
- If user withdraws before lock period ends:
  - 10% penalty on principal
  - All rewards (interest + GFT) forfeited
- Clear warning shown in UnstakeModal

### Rewards Calculation
- **Quarterly:** GFT tokens only (default: 1000 GFT)
- **Semi-Annual:** GFT tokens only (default: 1000 GFT)
- **Annual:** 2% stablecoin interest + GFT tokens (default: 1000 GFT)

## Navigation Structure

```
/ (Dashboard)
  - Collateral management
  - Borrowing & Lending
  - Health factor tracking

/savings (Savings)
  - Savings overview
  - Staking positions
  - Stake/Unstake management
```

## Testing Checklist

- [ ] Connect wallet on Lisk Sepolia
- [ ] Approve USDT/USDC for SavingsVault
- [ ] Stake with different lock periods
- [ ] View positions table updates
- [ ] Check rewards display is accurate
- [ ] Test early withdrawal with penalty warning
- [ ] Test withdrawal after lock period ends
- [ ] Verify GFT tokens are received on withdrawal
- [ ] Test navigation between Dashboard and Savings
- [ ] Test mobile responsive design
- [ ] Verify transaction states (pending, success, error)

## Future Enhancements

1. **Transaction History**
   - Add savings-specific transactions to history
   - Filter by stake/unstake events

2. **APY Calculator**
   - Show projected earnings based on amount and lock period
   - Compare different lock periods

3. **Multiple Stablecoins**
   - Support USDT, USDC, and other stablecoins
   - Selector in stake modal

4. **Position Compound**
   - Auto-restake matured positions
   - Compound rewards

5. **Notifications**
   - Alert users when positions are about to unlock
   - Push notifications for unlock dates

6. **Analytics**
   - Charts showing savings growth over time
   - Total rewards earned

## Contract Integration Notes

The SavingsVault contract includes these key functions:

**Read Functions:**
- `getUserPositions(address user)` - Returns all positions for a user
- `getUserActivePositionsCount(address user)` - Count of active positions
- `getTotalValueLocked(address stablecoin)` - TVL for a stablecoin
- `getProtocolStats()` - Users, positions, active positions
- `supportedStablecoins(address token)` - Check if supported
- `minimumDeposit()` - Minimum deposit amount (100 tokens default)
- `earlyWithdrawalPenalty()` - Penalty in basis points (1000 = 10%)
- `quarterlyGftReward()`, `semiAnnualGftReward()`, `annualGftReward()` - GFT rewards

**Write Functions:**
- `deposit(address stablecoin, uint256 amount, LockPeriod lockPeriod)` - Stake tokens
- `withdraw(uint256 positionIndex)` - Withdraw a position

**Events:**
- `Deposited` - Emitted when user stakes
- `Withdrawn` - Emitted when user withdraws

## Security Considerations

1. **Approval Management**
   - Users must approve tokens before staking
   - Approval checking prevents failed transactions

2. **Input Validation**
   - Minimum deposit enforced (100 tokens)
   - Balance checking prevents overdraft
   - Lock period validation

3. **Transaction States**
   - Loading states prevent double submissions
   - Success states trigger data refetch
   - Error handling with user feedback

4. **Early Withdrawal Protection**
   - Clear warning with penalty calculation
   - Separate button styling for early vs normal withdrawal

## Support

For issues or questions:
- Check contract events on block explorer
- Verify contract addresses match deployment
- Ensure wallet is on Lisk Sepolia network
- Check token approvals are sufficient

## Summary

The SavingsVault integration is now complete with:
- ✅ Full hook implementation for all contract functions
- ✅ Dedicated Savings page with position management
- ✅ Stake and Unstake modals with proper flows
- ✅ Navigation integration (Header + BottomNav)
- ✅ Responsive design for mobile and desktop
- ✅ Proper approval and transaction flows
- ✅ Early withdrawal warnings and penalty calculations
- ✅ Real-time position updates

The integration follows the same patterns as the existing VaultManager integration and maintains consistency across the application.
