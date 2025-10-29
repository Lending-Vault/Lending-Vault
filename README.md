# Lending Vault

A decentralized lending and borrowing platform built on Ethereum and Lisk networks. Users can deposit collateral, borrow assets, earn interest on savings, and participate in a secure DeFi ecosystem.

## 🌟 Key Features

- **Multi-Network Support**: Operates on both Ethereum and Lisk blockchains
- **Lending & Borrowing**: Deposit collateral to borrow other assets
- **Savings Vaults**: Earn rewards by staking tokens with different lock periods
- **Security-First**: Built with audited smart contracts and security best practices
- **User-Friendly Interface**: Clean, intuitive web interface for all operations

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/Lending-Vault.git
cd Lending-Vault
```

2. Install dependencies for both frontend and contracts
```bash
# Install frontend dependencies
cd frontend
npm install

# Install contract dependencies
cd ../Contracts
npm install
```

3. Set up environment variables
```bash
# Copy environment files
cp frontend/.env.example frontend/.env
cp Contracts/.env.example Contracts/.env
```

4. Run the development server
```bash
# Start the frontend
cd frontend
npm run dev

# In another terminal, compile contracts if needed
cd ../Contracts
npm run compile
```

5. Open your browser and navigate to `http://localhost:5173`

## 📁 Project Structure

```
Lending-Vault/
├── Contracts/                 # Smart contracts directory
│   ├── contracts/            # Solidity contract files
│   │   ├── VaultManager.sol  # Main lending/borrowing logic
│   │   ├── SavingsVault.sol  # Savings and staking logic
│   │   ├── PriceOracle.sol   # Price feed oracle
│   │   └── oracles/          # Oracle implementations
│   ├── scripts/              # Deployment and interaction scripts
│   ├── test/                 # Contract test files
│   └── artifacts/            # Compiled contract artifacts
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard/    # Dashboard page components
│   │   │   ├── Landing/      # Landing page components
│   │   │   ├── Layout/       # Layout components
│   │   │   ├── Modals/       # Modal components
│   │   │   └── UI/           # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── config/           # Configuration files
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── README.md                 # This file
└── .gitignore               # Git ignore file
```

## 📊 How It Works

### For Users

1. **Connect Your Wallet**: Connect your Web3 wallet to the platform
2. **Deposit Collateral**: Add assets to your vault as collateral
3. **Borrow Assets**: Borrow against your deposited collateral
4. **Manage Positions**: Monitor health factors and manage your positions
5. **Earn Rewards**: Stake tokens in savings vaults to earn rewards

### Key Concepts

- **Collateral**: Assets you deposit to secure your loans
- **Health Factor**: A metric indicating the safety of your position
- **Liquidation**: When health factor drops too low, positions may be liquidated
- **Savings Vaults**: Lock tokens for specific periods to earn rewards

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity**: Smart contract programming language
- **Hardhat**: Development environment for Ethereum software
- **OpenZeppelin**: Secure, tested smart contract libraries

### Frontend
- **React**: User interface library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection library


## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Website](https://your-website.com)
- [Documentation](https://docs.your-website.com)
- [Discord Community](https://discord.gg/your-invite)
- [Twitter](https://twitter.com/your-handle)

---

⚠️ **Disclaimer**: This software is provided "as-is" for educational and development purposes. Use at your own risk and always do your own research before interacting with DeFi protocols.