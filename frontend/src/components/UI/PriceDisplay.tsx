import React, { useEffect, useState } from 'react';
import { RefreshCw, DollarSign } from 'lucide-react';
import { redstonePriceFeed, type PriceData } from '../../utils/redstonePriceFeed';

interface PriceDisplayProps {
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ className = '' }) => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const symbols = ["ETH", "USDT"];
      const priceData: PriceData[] = [];

      for (const symbol of symbols) {
        const data = await redstonePriceFeed.fetchPrice(symbol);
        if (data) {
          priceData.push(data);
        }
      }

      // Add GMFOT as a stablecoin (pegged to USD)
      priceData.push({
        symbol: 'GMFOT',
        price: 1.0,
        timestamp: Date.now(),
      });

      setPrices(priceData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getPriceColor = (symbol: string) => {
    switch (symbol) {
      case 'ETH':
        return 'text-blue-400';
      case 'USDT':
        return 'text-green-400';
      case 'GMFOT':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading && prices.length === 0) {
    return (
      <div className={`bg-dark-bg border border-dark-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-dark-textMuted animate-spin mr-2" />
          <span className="text-sm text-dark-textMuted">Loading prices...</span>
        </div>
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className={`bg-danger-500/10 border border-danger-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-danger-400 mr-2" />
          <span className="text-sm text-danger-300">Price feed unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-dark-bg border border-dark-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-primary-400 mr-2" />
          <h3 className="text-sm font-semibold text-white">Live Prices</h3>
        </div>
        <button
          onClick={fetchPrices}
          className="text-dark-textMuted hover:text-white transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        {prices.map((priceData) => (
          <div key={priceData.symbol} className="text-center">
            <div className={`text-xs text-dark-textMuted mb-1`}>
              {priceData.symbol}
            </div>
            <div className={`text-sm font-semibold ${getPriceColor(priceData.symbol)}`}>
              ${priceData.price ? priceData.price.toFixed(2) : 'N/A'}
            </div>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <div className="text-xs text-dark-textMuted text-center mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div className="text-xs text-warning-300 text-center mt-2">
          Warning: {error}
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;