// RedStone Price Feed Utility
// Fetches token prices from RedStone API as a fallback to on-chain oracle

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

interface CachedPriceData {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

class RedStonePriceFeed {
  private cache: CachedPriceData = {};
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly API_BASE_URL = 'https://api.redstone.finance/prices';

  /**
   * Fetches price for a specific token from RedStone API
   * @param symbol Token symbol (e.g., "ETH", "USDT")
   * @returns Promise resolving to price data
   */
  async fetchPrice(symbol: string): Promise<PriceData | null> {
    try {
      // Check cache first
      const cached = this.cache[symbol];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return {
          symbol,
          price: cached.price,
          timestamp: cached.timestamp,
        };
      }

      // Fetch from API
      const response = await fetch(
        `${this.API_BASE_URL}?symbol=${symbol}&provider=redstone`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error(`No price data available for ${symbol}`);
      }

      const price = data[0]?.value;
      const timestamp = data[0]?.timestamp;

      if (typeof price !== 'number' || isNaN(price)) {
        throw new Error(`Invalid price data for ${symbol}`);
      }

      // Update cache
      this.cache[symbol] = {
        price,
        timestamp: timestamp || Date.now(),
      };

      return {
        symbol,
        price,
        timestamp: timestamp || Date.now(),
      };
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetches prices for multiple tokens
   * @param symbols Array of token symbols
   * @returns Promise resolving to array of price data
   */
  async fetchPrices(symbols: string[]): Promise<PriceData[]> {
    const results: PriceData[] = [];
    
    for (const symbol of symbols) {
      const priceData = await this.fetchPrice(symbol);
      if (priceData) {
        results.push(priceData);
      }
    }
    
    return results;
  }

  /**
   * Gets ETH price in USD
   * @returns Promise resolving to ETH price or null if failed
   */
  async getETHPrice(): Promise<number | null> {
    const priceData = await this.fetchPrice('ETH');
    return priceData?.price || null;
  }

  /**
   * Gets GMFOT price (assuming it's pegged to USD)
   * @returns Promise resolving to GMFOT price (typically 1.0)
   */
  async getGMFOTPrice(): Promise<number> {
    // GMFOT is a stablecoin pegged to USD
    // We could fetch this from RedStone if available, but for now assume 1:1
    return 1.0;
  }

  /**
   * Gets price for any token
   * @param symbol Token symbol
   * @returns Promise resolving to price or null if failed
   */
  async getPrice(symbol: string): Promise<number | null> {
    const priceData = await this.fetchPrice(symbol);
    return priceData?.price || null;
  }

  /**
   * Clears the price cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Gets cached price if available and not expired
   * @param symbol Token symbol
   * @returns Cached price or null
   */
  getCachedPrice(symbol: string): number | null {
    const cached = this.cache[symbol];
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }
    return null;
  }
}

// Export singleton instance
export const redstonePriceFeed = new RedStonePriceFeed();

// Export types
export type { PriceData };