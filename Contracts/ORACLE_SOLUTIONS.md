# 🔗 Oracle Solutions for Multi-Chain Deployment

## ** Overview**

LiquidVault now supports multiple oracle providers for different blockchain networks, ensuring reliable price feeds across all supported chains.

## **🌐 Network Support & Oracle Mapping**

| Network      | Oracle Provider | Status           | Price Feeds                 |
| ------------ | --------------- | ---------------- | --------------------------- |
| **Ethereum** | Chainlink       | Production Ready | ETH/USD, USDT/USD, USDC/USD |
| **Lisk**     | RedStone        | Production Ready | ETH, USDT, USDC, LSK        |
| **Polygon**  | Chainlink       | Future Expansion | ETH/USD, USDT/USD           |
| **Arbitrum** | Chainlink       | Future Expansion | ETH/USD, USDT/USD           |

## ** Architecture**

### **Universal Oracle Interface**

```solidity
interface IUniversalOracle {
    function getPrice(address token) external view returns (uint256 price, uint256 timestamp);
    function hasPrice(address token) external view returns (bool);
    function getPriceStalenessThreshold() external view returns (uint256);
}
```

### **Oracle Manager (Fallback System)**

- **Primary Oracle**: Network-specific (Chainlink/RedStone)
- **Secondary Oracle**: Alternative provider (optional)
- **Manual Oracle**: Emergency fallback for all networks

## ** Implementation Details**

### **1. Chainlink Oracle (Ethereum)**

```solidity
// Ethereum mainnet price feeds
ETH/USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
USDT/USD: 0x3E7d1eAB13ad0104d2750B8863b489D65364e32D
```

**Features:**

- Decentralized price feeds
- 1-hour staleness threshold
- Automatic price validation
- High reliability (99.9% uptime)

### **2. RedStone Oracle (Lisk)**

```solidity
// RedStone data feed IDs
ETH: "ETH"
USDT: "USDT"
USDC: "USDC"
LSK: "LSK"
```

**Features:**

- Modular oracle infrastructure
- 24 hour staleness threshold
- Authorized relayer system
- Optimized for emerging markets

### **3. Manual Oracle (Fallback)**

```solidity
// Emergency price setting
function emergencySetPrice(address token, uint256 price) external onlyOwner;
```

**Features:**

- Owner-controlled price updates
- Security validations (bounds, frequency, change limits)
- Emergency override capabilities
- Available on all networks

## ** Deployment Guide**

### **Deploy on Lisk (RedStone)**

```bash
# Deploy with RedStone Oracle
npx hardhat run scripts/deploy-lisk.ts --network liskSepolia

# Configure RedStone relayers
npx hardhat run scripts/configure-redstone.ts --network liskSepolia
```

### **Deploy on Ethereum (Chainlink)**

```bash
# Deploy with Chainlink Oracle
npx hardhat run scripts/deploy-ethereum.ts --network sepolia

# Chainlink feeds are automatically configured
```

## ** Configuration**

### **Network Configuration**

```typescript
// config/networks.ts
export const NETWORK_CONFIGS = {
  lisk: {
    oracle: { type: "redstone", available: true },
    chainId: 1135,
  },
  ethereum: {
    oracle: { type: "chainlink", available: true },
    chainId: 1,
  },
};
```

### **Oracle Manager Setup**

```solidity
// Set primary oracle (network-specific)
oracleManager.setPrimaryOracle(redstoneOracle); // Lisk
oracleManager.setPrimaryOracle(chainlinkOracle); // Ethereum

// Set fallback oracle (all networks)
oracleManager.setManualOracle(manualOracle);
```

## ** Security Features**

### **Price Validation**

- **Staleness Checks**: Reject outdated prices
- **Bounds Validation**: Min/max price limits
- **Deviation Limits**: Max 10% difference between oracles
- **Fallback Mechanism**: Automatic failover to backup oracles

### **Access Control**

- **Owner-only Configuration**: Only owner can set oracles
- **Authorized Relayers**: Only approved addresses can update RedStone prices
- **Emergency Controls**: Manual override for critical situations

## ** Monitoring & Maintenance**

### **Price Feed Health**

```solidity
// Check if price feed is healthy
bool isHealthy = oracleManager.hasPrice(tokenAddress);

// Get last update timestamp
(uint256 price, uint256 timestamp) = oracle.getPrice(tokenAddress);
```

### **Recommended Monitoring**

1. **Price Staleness**: Alert if prices are older than threshold
2. **Oracle Availability**: Monitor primary oracle uptime
3. **Price Deviations**: Alert on large price movements
4. **Fallback Usage**: Track when backup oracles are used

## ** Future Enhancements**

### **Planned Integrations**

- **Pyth Network**: For high-frequency trading
- **Band Protocol**: Additional decentralized oracle option
- **Tellor**: Community-driven oracle network

### **Advanced Features**

- **Time-weighted Average Prices (TWAP)**
- **Multiple price source aggregation**
- **Automated oracle switching based on reliability**
- **Cross-chain price synchronization**

## ** Troubleshooting**

### **Common Issues**

**1. "Price Not Set" Error**

```solidity
// Solution: Configure price feed for token
oracle.addTokenDataFeed(tokenAddress, dataFeedId);
```

**2. "Stale Price" Error**

```solidity
// Solution: Update price or check oracle status
oracle.updatePrice(tokenAddress, newPrice);
```

**3. "Price Deviation Too High" Error**

```solidity
// Solution: Check if one oracle is malfunctioning
// Use manual override if necessary
manualOracle.emergencySetPrice(tokenAddress, correctPrice);
```

## ** Support**

For oracle-related issues:

1. Check network configuration in `config/networks.ts`
2. Verify oracle contract addresses in deployment files
3. Monitor price feed health using provided tools
4. Use manual oracle for emergency situations

---

**All warnings fixed, security maintained, and multi-chain oracle support implemented!**
