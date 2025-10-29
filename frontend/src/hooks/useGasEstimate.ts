import { useAccount, useGasPrice } from 'wagmi';
import { formatUnits } from 'viem';

/**
 * Hook to estimate gas fees for transactions
 */
export function useGasEstimate() {
  const { chainId } = useAccount();

  /**
   * Get current gas price
   */
  const { data: gasPrice } = useGasPrice({
    query: {
      enabled: !!chainId,
    },
  });

  /**
   * Convert gas estimate to USD value
   */
  const convertGasToUSD = (gasEstimate: bigint, ethPriceUSD: number = 2000) => {
    if (!gasEstimate) return 0;
    
    // Use a default gas price if not available (typical Sepolia gas price)
    // 20 gwei is a reasonable default for Sepolia testnet
    const defaultGasPrice = BigInt(20000000000); // 20 gwei in wei
    const actualGasPrice = gasPrice || defaultGasPrice;
    
    // Calculate gas cost in wei (gasLimit * gasPrice)
    const gasCostWei = gasEstimate * actualGasPrice;
    
    // Convert to ETH
    const gasCostETH = parseFloat(formatUnits(gasCostWei, 18));
    
    // Convert to USD (using default ETH price of $2000, should be passed as parameter)
    const gasCostUSD = gasCostETH * ethPriceUSD;
    
    return gasCostUSD;
  };

  /**
   * Get estimated gas cost for withdraw operation in USD
   */
  const getWithdrawGasEstimate = (ethPriceUSD: number = 2000) => {
    // Typical gas limit for withdraw operations: 80000 gas
    const estimatedGasLimit = BigInt(80000);
    const gasCostUSD = convertGasToUSD(estimatedGasLimit, ethPriceUSD);
    
    return gasCostUSD;
  };

  /**
   * Get estimated gas cost for deposit operation in USD
   */
  const getDepositGasEstimate = (ethPriceUSD: number = 2000) => {
    // Typical gas limit for deposit operations: 100000 gas
    const estimatedGasLimit = BigInt(100000);
    const gasCostUSD = convertGasToUSD(estimatedGasLimit, ethPriceUSD);
    
    return gasCostUSD;
  };

  /**
   * Get estimated gas cost for borrow operation in USD
   */
  const getBorrowGasEstimate = (ethPriceUSD: number = 2000) => {
    // Typical gas limit for borrow operations: 120000 gas
    const estimatedGasLimit = BigInt(120000);
    const gasCostUSD = convertGasToUSD(estimatedGasLimit, ethPriceUSD);
    
    return gasCostUSD;
  };

  /**
   * Get estimated gas cost for repay operation in USD
   */
  const getRepayGasEstimate = (ethPriceUSD: number = 2000) => {
    // Typical gas limit for repay operations: 90000 gas
    const estimatedGasLimit = BigInt(90000);
    const gasCostUSD = convertGasToUSD(estimatedGasLimit, ethPriceUSD);
    
    return gasCostUSD;
  };

  return {
    getWithdrawGasEstimate,
    getDepositGasEstimate,
    getBorrowGasEstimate,
    getRepayGasEstimate,
    convertGasToUSD,
    gasPrice,
  };
}