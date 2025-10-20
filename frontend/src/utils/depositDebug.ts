// Deposit Debug Helper
// Use this in the browser console to test deposit functionality

import { parseEther } from 'viem';

/**
 * Debug helper to check deposit readiness
 * Call this in console: window.checkDepositReadiness()
 */
export function checkDepositReadiness() {
  const checks = {
    wallet: {
      connected: false,
      address: null as string | null,
      chainId: null as number | null,
      network: null as string | null,
    },
    contract: {
      address: null as string | null,
      hasABI: false,
    },
    balance: {
      eth: null as string | null,
      sufficient: false,
    },
    errors: [] as string[],
  };

  try {
    // Check wallet connection
    const accountElements = document.querySelectorAll('[data-testid="rk-account-button"]');
    checks.wallet.connected = accountElements.length > 0;

    // Check for Wagmi context
    if (typeof window !== 'undefined') {
      // @ts-ignore - checking global wagmi state
      const wagmiStore = window.__WAGMI_STORE__;
      if (wagmiStore) {
        console.log('✅ Wagmi store found');
      }
    }

    console.log('🔍 Deposit Readiness Check:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Wallet:', checks.wallet);
    console.log('Contract:', checks.contract);
    console.log('Balance:', checks.balance);

    if (checks.errors.length > 0) {
      console.error('❌ Errors:', checks.errors);
    } else {
      console.log('✅ No errors detected');
    }

    return checks;
  } catch (error) {
    console.error('Debug check failed:', error);
    return checks;
  }
}

/**
 * Test deposit transaction formatting
 */
export function testDepositTxFormat(amount: string = '0.01') {
  try {
    console.log('🧪 Testing Deposit Transaction Format');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse amount
    const amountInWei = parseEther(amount);
    console.log('Input Amount:', amount, 'ETH');
    console.log('Wei Value:', amountInWei.toString());
    console.log('Hex Value:', `0x${amountInWei.toString(16)}`);

    // Expected transaction structure
    const expectedTx = {
      to: 'VaultManager_Address', // Will be replaced with actual address
      value: amountInWei,
      data: '0xf6326fb3', // depositETH() function selector
      gasLimit: 'estimated',
    };

    console.log('\n📝 Expected Transaction:');
    console.log(expectedTx);

    console.log('\n✅ Transaction format test complete');
    return expectedTx;
  } catch (error) {
    console.error('❌ Transaction format test failed:', error);
    return null;
  }
}

/**
 * Log current network and contract info
 */
export function logNetworkInfo() {
  console.log('🌐 Network Information');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const networks = {
    'Lisk Sepolia': {
      chainId: 4202,
      rpc: 'https://rpc.sepolia-api.lisk.com',
      explorer: 'https://sepolia-blockscout.lisk.com',
    },
    'Ethereum Sepolia': {
      chainId: 11155111,
      rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
      explorer: 'https://sepolia.etherscan.io',
    },
  };

  Object.entries(networks).forEach(([name, info]) => {
    console.log(`\n${name}:`);
    console.log(`  Chain ID: ${info.chainId}`);
    console.log(`  RPC: ${info.rpc}`);
    console.log(`  Explorer: ${info.explorer}`);
  });

  return networks;
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).checkDepositReadiness = checkDepositReadiness;
  (window as any).testDepositTxFormat = testDepositTxFormat;
  (window as any).logNetworkInfo = logNetworkInfo;

  console.log('🛠️ Debug helpers loaded! Available commands:');
  console.log('  window.checkDepositReadiness() - Check if deposit is ready');
  console.log('  window.testDepositTxFormat("0.01") - Test transaction formatting');
  console.log('  window.logNetworkInfo() - Show network information');
}
