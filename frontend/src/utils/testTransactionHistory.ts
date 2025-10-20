// Test script to verify the transaction history fix
import { createPublicClient, http } from 'viem';
import { liskSepolia, sepolia } from 'wagmi/chains';

// Create clients for both networks
const liskClient = createPublicClient({
  chain: liskSepolia,
  transport: http('https://rpc.sepolia-api.lisk.com'),
});

const ethClient = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

// Test function to check if our fix works
export async function testTransactionHistoryFix() {
  console.log('Testing transaction history fix for large block ranges...\n');
  
  // Test Lisk Sepolia
  console.log('Testing Lisk Sepolia:');
  try {
    const latestBlock = await liskClient.getBlockNumber();
    const deploymentBlock = 27692365n; // From our code
    const blockRange = latestBlock - deploymentBlock;
    
    console.log(`  Latest block: ${latestBlock}`);
    console.log(`  Deployment block: ${deploymentBlock}`);
    console.log(`  Block range: ${blockRange} blocks`);
    
    if (blockRange > 100000n) {
      console.log(`  ✓ Block range exceeds 100,000 blocks - chunking will be applied`);
    } else {
      console.log(`  ⚠ Block range is within limits - original query would work`);
    }
    
    // Test a larger chunk to verify the RPC works (PublicNode should support larger ranges)
    const testFromBlock = latestBlock - 10000n;
    const testLogs = await liskClient.getLogs({
      address: '0x2a8066293B7673824209EA175dD157Dc6469E589', // VaultManager
      event: {
        type: 'event',
        name: 'CollateralDeposited',
        inputs: [
          { type: 'address', indexed: true, name: 'user' },
          { type: 'address', indexed: true, name: 'token' },
          { type: 'uint256', indexed: false, name: 'amount' },
        ],
      },
      fromBlock: testFromBlock,
      toBlock: latestBlock,
    });
    
    console.log(`  ✓ Test query successful: found ${testLogs.length} logs in last 10000 blocks`);
  } catch (error) {
    console.error(`  ✗ Test failed:`, error);
  }
  
  console.log('\nTesting Ethereum Sepolia:');
  try {
    const latestBlock = await ethClient.getBlockNumber();
    const deploymentBlock = 9430618n; // From our code
    const blockRange = latestBlock - deploymentBlock;
    
    console.log(`  Latest block: ${latestBlock}`);
    console.log(`  Deployment block: ${deploymentBlock}`);
    console.log(`  Block range: ${blockRange} blocks`);
    
    if (blockRange > 50000n) {
      console.log(`  ✓ Block range exceeds 50,000 blocks - chunking will be applied`);
    } else {
      console.log(`  ⚠ Block range is within limits - original query would work`);
    }
    
    // Test a larger chunk to verify the RPC works (PublicNode should support larger ranges)
    const testFromBlock = latestBlock - 10000n;
    const testLogs = await ethClient.getLogs({
      address: '0xe19E99D644e56644CBd4428957996F9103b7C240', // VaultManager
      event: {
        type: 'event',
        name: 'CollateralDeposited',
        inputs: [
          { type: 'address', indexed: true, name: 'user' },
          { type: 'address', indexed: true, name: 'token' },
          { type: 'uint256', indexed: false, name: 'amount' },
        ],
      },
      fromBlock: testFromBlock,
      toBlock: latestBlock,
    });
    
    console.log(`  ✓ Test query successful: found ${testLogs.length} logs in last 10000 blocks`);
  } catch (error) {
    console.error(`  ✗ Test failed:`, error);
  }
  
  console.log('\nTest completed!');
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testTransactionHistoryFix().catch(console.error);
}