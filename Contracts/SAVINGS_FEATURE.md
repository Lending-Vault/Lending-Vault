# LiquidVault Savings Feature

## ** Overview**

The LiquidVault Savings Feature introduces a new savings protocol that allows users to deposit stablecoins for fixed periods and earn rewards in both stablecoins and GMFOT (GFT) tokens.

## ** GMFOT Token (GFT)**

### **Token Specifications**

- **Name**: GMFOT Token
- **Symbol**: GFT
- **Standard**: ERC20 with extensions
- **Max Supply**: 100,000,000 GFT (100M tokens)
- **Decimals**: 18

### **Key Features**

- **Controlled Minting**: Only authorized addresses can mint
- **Burnable**: Users can burn their own tokens
- **Pausable**: Emergency pause functionality
- **Access Control**: Owner-controlled authorization system
- **Supply Tracking**: Tracks total minted and burned tokens

### **Security Features**

```solidity
// Authorization required for minting
modifier onlyAuthorizedMinter() {
    require(authorizedMinters[msg.sender], "Not authorized");
    _;
}

// Maximum supply protection
require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
```

## ** Savings Vault**

### **Supported Lock Periods**

| Period          | Duration  | Stablecoin Interest | GFT Reward |
| --------------- | --------- | ------------------- | ---------- |
| **Quarterly**   | 3 months  | 0%                  | 1,000 GFT  |
| **Semi-Annual** | 6 months  | 0%                  | 1,000 GFT  |
| **Annual**      | 12 months | 2% APR              | 1,000 GFT  |

### **Interest Structure**

**Annual Savings (12 months):**

- **2% APR** in deposited stablecoin (USDT/USDC)
- **1,000 GFT tokens** as bonus reward
- **365-day lock period**

**Quarterly/Semi-Annual Savings:**

- **0% stablecoin interest** (shorter commitment)
- **1,000 GFT tokens** as reward
- **90/180-day lock periods**

### **Early Withdrawal**

- **10% penalty** on principal amount
- **No interest** or GFT rewards
- **Available anytime** for emergencies

## ** Technical Implementation**

### **Core Contracts**

**1. GMFOTToken.sol**

```solidity
contract GMFOTToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    mapping(address => bool) public authorizedMinters;

    function mint(address to, uint256 amount) external onlyAuthorizedMinter;
    function authorizeMinter(address minter) external onlyOwner;
}
```

**2. SavingsVault.sol**

```solidity
contract SavingsVault is ReentrancyGuard, Pausable, Ownable {
    enum LockPeriod { QUARTERLY, SEMI_ANNUAL, ANNUAL }

    struct SavingsPosition {
        uint256 positionId;
        address stablecoin;
        uint256 principal;
        uint256 depositTime;
        uint256 lockEndTime;
        LockPeriod lockPeriod;
        bool withdrawn;
        uint256 stablecoinInterest;
        uint256 gftReward;
    }
}
```

### **Key Functions**

**Deposit Function:**

```solidity
function deposit(
    address stablecoin,
    uint256 amount,
    LockPeriod lockPeriod
) external nonReentrant whenNotPaused;
```

**Withdrawal Function:**

```solidity
function withdraw(uint256 positionIndex) external nonReentrant whenNotPaused;
```

**Reward Calculation:**

```solidity
function _calculateRewards(uint256 amount, LockPeriod lockPeriod)
    internal view returns (uint256 stablecoinInterest, uint256 gftReward);
```

## ** Security Features**

### **Access Control**

- **Owner-only functions**: Configuration, emergency controls
- **Authorized minters**: Only approved contracts can mint GFT
- **Pause mechanism**: Emergency stop for all operations

### **Financial Security**

- **ReentrancyGuard**: Prevents reentrancy attacks
- **SafeERC20**: Safe token transfers
- **Minimum deposit**: 100 USDT/USDC minimum
- **Early withdrawal penalty**: 10% maximum penalty

### **Validation Checks**

```solidity
// Supported stablecoin check
require(supportedStablecoins[stablecoin], "Unsupported stablecoin");

// Minimum deposit check
require(amount >= minimumDeposit, "Insufficient amount");

// Position validation
require(positionIndex < userPositions[msg.sender].length, "Position not found");
require(!position.withdrawn, "Already withdrawn");
```

## ** Protocol Statistics**

### **Tracking Metrics**

- **Total Users**: Number of unique users
- **Total Positions**: Number of savings positions created
- **Total Value Locked (TVL)**: Per stablecoin tracking
- **Active Positions**: Currently locked positions

### **View Functions**

```solidity
function getUserPositions(address user) external view returns (SavingsPosition[]);
function getTotalValueLocked(address stablecoin) external view returns (uint256);
function getProtocolStats() external view returns (uint256, uint256, uint256);
```

## ** Deployment & Configuration**

### **Deployment Order**

1. **Deploy GMFOT Token**
2. **Deploy Savings Vault** (with GFT token address)
3. **Authorize Savings Vault** as GFT minter
4. **Add supported stablecoins** (USDT, USDC)
5. **Configure treasury** for interest payments

### **Network Support**

| Network      | Oracle    | Status | Deployment Script    |
| ------------ | --------- | ------ | -------------------- |
| **Lisk**     | RedStone  | Ready  | `deploy-lisk.ts`     |
| **Ethereum** | Chainlink | Ready  | `deploy-ethereum.ts` |

### **Configuration Commands**

```bash
# Deploy on Lisk
npx hardhat run scripts/deploy-lisk.ts --network liskSepolia

# Deploy on Ethereum
npx hardhat run scripts/deploy-ethereum.ts --network sepolia
```

## ** Testing**

### **Test Coverage**

- **Deployment tests**: Contract initialization
- **Deposit tests**: All lock periods
- **Withdrawal tests**: Normal and early withdrawal
- **Reward tests**: Stablecoin interest and GFT rewards
- **Security tests**: Pause, access control, validation
- **Admin tests**: Configuration updates

### **Test Results**

```
SavingsVault: 14 passing tests
VaultManager: 5 passing tests
Total: 19 passing tests
```

## ** Usage Examples**

### **Quarterly Savings**

```typescript
// Deposit 1000 USDT for 3 months
await usdt.approve(savingsVault.address, ethers.parseEther("1000"));
await savingsVault.deposit(usdt.address, ethers.parseEther("1000"), 0); // QUARTERLY

// After 90 days: Withdraw principal + 1000 GFT
await savingsVault.withdraw(0);
```

### **Annual Savings**

```typescript
// Deposit 1000 USDT for 12 months
await usdt.approve(savingsVault.address, ethers.parseEther("1000"));
await savingsVault.deposit(usdt.address, ethers.parseEther("1000"), 2); // ANNUAL

// After 365 days: Withdraw 1000 USDT + 20 USDT interest + 1000 GFT
await savingsVault.withdraw(0);
```

## ** Future Enhancements**

### **Planned Features**

- **Variable APR**: Dynamic interest rates based on market conditions
- **Loyalty Rewards**: Increased GFT rewards for long-term users
- **Auto-renewal**: Automatic position renewal options
- **Yield Strategies**: Integration with DeFi yield protocols
- **Referral Program**: GFT rewards for user referrals

### **Token Utility Expansion**

- **Governance**: GFT holders vote on protocol parameters
- **Fee Discounts**: Reduced fees for GFT holders
- **Staking Rewards**: Additional yield for staking GFT
- **Marketplace**: Use GFT for protocol services

---
