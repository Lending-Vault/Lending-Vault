import React, { useEffect, useState } from "react";

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

const PriceFeed: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const symbols = ["ETH", "LSK", "USDT"];
      const priceData: PriceData[] = [];

      for (const symbol of symbols) {
        const response = await fetch(
          `https://api.redstone.finance/prices?symbol=${symbol}&provider=redstone`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${symbol} price: ${response.status}`
          );
        }
        const data = await response.json();
        priceData.push({
          symbol,
          price: data[0]?.value,
          timestamp: data[0]?.timestamp,
        });
      }

      setPrices(priceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading prices...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>RedStone Price Feed</h1>
      <p>
        Last updated:{" "}
        {prices.length > 0
          ? new Date(prices[0].timestamp).toLocaleString()
          : "N/A"}
      </p>
      <ul>
        {prices.map((priceData) => (
          <li key={priceData.symbol}>
            {priceData.symbol}: $
            {priceData.price ? priceData.price.toFixed(2) : "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PriceFeed;
