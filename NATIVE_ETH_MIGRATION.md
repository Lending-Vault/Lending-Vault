# Native ETH Migration Guide

This document outlines all changes made to support native Sepolia ETH deposits on both Ethereum Sepolia and Lisk Sepolia networks, replacing the previous MockWETH token approach.

## Overview

The protocol now accepts **native ETH** as collateral instead of ERC20 tokens like MockWETH. This simplifies the user experience by eliminating the need for token approvals when depositing collateral.

---

## Contract Changes (Backend)

### 1. VaultManager.sol

#### Added Constants
```solidity
// Special address to represent native ETH in collateral mappings
address public constant NATIVE_ETH = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
```

#### New Functions

**depositETH()** - Deposit native ETH as collateral
```solidity
function depositETH() external payable nonReentrant whenNotPaused {
    if (msg.value == 0) revert VaultManager__ZeroAmount();
    if (!acceptedCollateral[NATIVE_ETH]) revert VaultManager__TokenNotAccepted();

    collateral[msg.sender][NATIVE_ETH] += msg.value;

    emit CollateralDeposited(msg.sender, NATIVE_ETH, msg.value);
}
```

**withdrawETH()** - Withdraw native ETH collateral
```solidity
function withdrawETH(uint256 amount) external nonReentrant whenNotPaused {
    if (amount == 0) revert VaultManager__ZeroAmount();
    if (collateral[msg.sender][NATIVE_ETH] < amount) revert VaultManager__InsufficientCollateral();

    // Health factor check
    collateral[msg.sender][NATIVE_ETH] -= amount;
    uint256 healthFactor = getOverallHealthFactor(msg.sender);
    if (healthFactor < LIQUIDATION_THRESHOLD && healthFactor != type(uint256).max) {
        collateral[msg.sender][NATIVE_ETH] += amount;
        revert VaultManager__HealthFactorTooLow();
    }

    // Transfer native ETH
    (bool success, ) = msg.sender.call{value: amount}("");
    if (!success) revert VaultManager__TransferFailed();

    emit CollateralWithdrawn(msg.sender, NATIVE_ETH, amount);
}
```

**receive()** - Allow contract to receive ETH
```solidity
receive() external payable {}
```

#### Modified Functions

**deposit()** - Now explicitly rejects NATIVE_ETH address
```solidity
if (token == NATIVE_ETH) revert VaultManager__TokenNotAccepted(); // Use depositETH() for native ETH
```

**withdraw()** - Now explicitly rejects NATIVE_ETH address
```solidity
if (token == NATIVE_ETH) revert VaultManager__TokenNotAccepted(); // Use withdrawETH() for native ETH
```

**liquidate()** - Updated to handle native ETH transfers
```solidity
if (collateralToken == NATIVE_ETH) {
    // Transfer ETH using low-level call
    (bool success, ) = recipient.call{value: amount}("");
    if (!success) revert VaultManager__TransferFailed();
} else {
    // Transfer ERC20 tokens
    IERC20(collateralToken).safeTransfer(recipient, amount);
}
```

---

## Frontend Changes

### 1. Configuration Updates

#### contracts.ts
- Removed `MockWETH` from `CONTRACT_ADDRESSES`
- Added `NATIVE_ETH` constant
```typescript
export const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;
```

### 2. New Hooks (useVaultManager.ts)

#### useNativeBalance()
Gets user's native ETH balance using Wagmi's `useBalance` hook.

#### useUserCollateral(token)
Reads user's collateral for a specific token from VaultManager contract.

#### useUserDebt(token)
Reads user's debt for a specific token from VaultManager contract.

#### useDepositETH()
Deposits native ETH to VaultManager contract.
```typescript
const { depositETH, isPending, isSuccess } = useDepositETH();
await depositETH(amount); // amount in ETH string format
```

#### useWithdrawETH()
Withdraws native ETH from VaultManager contract.
```typescript
const { withdrawETH, isPending, isSuccess } = useWithdrawETH();
await withdrawETH(amount); // amount in ETH string format
```

### 3. Updated Hooks

#### useHealthFactor()
Now requires both collateral and debt token addresses:
```typescript
useHealthFactor(collateralToken, debtToken)
```

### 4. Component Updates

#### DepositModal.tsx
- Removed ERC20 approval flow (approve/confirm steps)
- Now uses `useNativeBalance()` instead of `useTokenBalance()`
- Direct deposit without approval
- Automatically reserves 0.01 ETH for gas when using "Max" button

#### Dashboard.tsx
- Updated to use `NATIVE_ETH` constant instead of `MockWETH`
- Changed from `useUserVault()` to `useUserCollateral()` and `useUserDebt()`
- Updated `handleDeposit()` to call `depositETH()`
- Updated `handleWithdraw()` to call `withdrawETH()`
- Changed token symbol from "WETH" to "ETH" throughout
- Updated token name from "Wrapped Ethereum" to "Ethereum"

### 5. Exports (hooks/index.ts)
Updated to export new hooks:
- `useNativeBalance`
- `useUserCollateral`
- `useUserDebt`
- `useDepositETH`
- `useWithdrawETH`
- `NATIVE_ETH`

---

## Deployment Steps

### 1. Smart Contract Deployment

1. Update VaultManager.sol with new functions
2. Compile contracts:
   ```bash
   cd Contracts
   npx hardhat compile
   ```

3. Deploy updated VaultManager to both networks:
   ```bash
   # Ethereum Sepolia
   npx hardhat run scripts/deploy.js --network sepolia

   # Lisk Sepolia
   npx hardhat run scripts/deploy.js --network liskSepolia
   ```

4. **IMPORTANT**: Add NATIVE_ETH as accepted collateral:
   ```javascript
   const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
   await vaultManager.addCollateral(NATIVE_ETH);
   ```

5. Set up price oracle for NATIVE_ETH:
   ```javascript
   await oracleManager.setOracle(NATIVE_ETH, ethOracleAddress);
   ```

6. Update `frontend/src/config/contracts.ts` with new contract addresses

### 2. ABI Updates

1. Copy the new VaultManager ABI:
   ```bash
   cp Contracts/artifacts/contracts/VaultManager.sol/VaultManager.json \
      frontend/src/abis/VaultManager.json
   ```

### 3. Frontend Deployment

1. Install dependencies (if needed):
   ```bash
   cd frontend
   npm install
   ```

2. Build frontend:
   ```bash
   npm run build
   ```

3. Deploy to hosting service (Vercel, Netlify, etc.)

---

## Testing Checklist

### Smart Contract Tests

- [ ] Test `depositETH()` with various amounts
- [ ] Test `depositETH()` reverts when amount is 0
- [ ] Test `depositETH()` reverts when NATIVE_ETH not accepted
- [ ] Test `withdrawETH()` with valid amounts
- [ ] Test `withdrawETH()` reverts when amount > balance
- [ ] Test `withdrawETH()` reverts when health factor too low
- [ ] Test borrow against ETH collateral
- [ ] Test liquidation with ETH collateral
- [ ] Test `receive()` function accepts ETH
- [ ] Test that `deposit()` rejects NATIVE_ETH address
- [ ] Test that `withdraw()` rejects NATIVE_ETH address

### Frontend Tests

- [ ] Connect wallet on Ethereum Sepolia
- [ ] Connect wallet on Lisk Sepolia
- [ ] Check ETH balance displays correctly
- [ ] Deposit small amount of ETH
- [ ] Deposit using "Max" button (should reserve gas)
- [ ] Check collateral updates after deposit
- [ ] Borrow GMFOT against ETH collateral
- [ ] Check health factor calculation
- [ ] Withdraw partial ETH collateral
- [ ] Withdraw fails when health factor too low
- [ ] Repay debt
- [ ] Withdraw remaining collateral
- [ ] Check transaction history
- [ ] Test on mobile view

---

## Key Differences: Native ETH vs ERC20

| Aspect | ERC20 (MockWETH) | Native ETH |
|--------|------------------|------------|
| **Approval** | Required before deposit | Not required |
| **Deposit Flow** | approve() → deposit() | depositETH() |
| **Function Type** | Regular | Payable (`msg.value`) |
| **Gas Cost** | Higher (2 transactions) | Lower (1 transaction) |
| **User Experience** | 2-step process | 1-step process |
| **Transfer Method** | `safeTransfer()` | `call{value}("")` |

---

## Security Considerations

1. **Reentrancy Protection**: All payable functions use `nonReentrant` modifier
2. **ETH Transfer Method**: Using `call{value}("")` instead of deprecated `transfer()` or `send()`
3. **Health Factor Checks**: Performed before allowing withdrawals
4. **Zero Amount Checks**: Prevent dust deposits/withdrawals
5. **Fallback Protection**: `receive()` function allows contract to accept ETH

---

## Migration from Existing Deployments

If you have users with existing MockWETH deposits:

1. **DO NOT** immediately remove MockWETH support
2. Continue supporting both MockWETH and native ETH
3. Notify users to migrate their positions:
   - Withdraw MockWETH collateral
   - Deposit equivalent ETH collateral
4. After migration period, remove MockWETH from accepted collateral
5. Update UI to only show ETH option

---

## Troubleshooting

### Contract Issues

**"VaultManager__TokenNotAccepted" error**
- Ensure `addCollateral(NATIVE_ETH)` was called after deployment
- Check owner has called this function

**"VaultManager__TransferFailed" error**
- Recipient might have a contract that rejects ETH
- Check gas limits are sufficient

### Frontend Issues

**Balance showing as 0**
- Check wallet is connected
- Verify network is Sepolia or Lisk Sepolia
- Ensure RPC provider is working

**Transaction fails immediately**
- Check user has sufficient ETH for both deposit and gas
- Verify contract is not paused
- Check health factor requirements

**Transaction pending forever**
- Check gas price is sufficient
- View transaction on block explorer
- May need to increase gas price and resubmit

---

## Environment Variables

Ensure these are set in your `.env` file:

```bash
# Frontend
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Contracts
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

---

## Resources

- [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/)
- [Ethereum Sepolia Faucet](https://sepoliafaucet.com/)
- [VaultManager Contract](./Contracts/contracts/VaultManager.sol)
- [Frontend Hooks](./frontend/src/hooks/useVaultManager.ts)

---

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Check existing documentation
- Review transaction on block explorer for on-chain errors
