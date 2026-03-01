export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  type: "crypto" | "forex" | "stock" | "etf";
  icon?: string;
}

export const defaultCryptoAssets: Asset[] = [
  { symbol: "BTC/USDT", name: "Bitcoin / Tether", price: 43250.82, change24h: 1250.50, changePercent24h: 2.98, volume24h: 28500000000, marketCap: 847000000000, type: "crypto" },
  { symbol: "ETH/USDT", name: "Ethereum / Tether", price: 2285.45, change24h: -45.20, changePercent24h: -1.94, volume24h: 15200000000, marketCap: 274000000000, type: "crypto" },
  { symbol: "SOL/USDT", name: "Solana / Tether", price: 98.76, change24h: 5.32, changePercent24h: 5.69, volume24h: 2800000000, marketCap: 42000000000, type: "crypto" },
  { symbol: "XRP/USDT", name: "Ripple / Tether", price: 0.6245, change24h: -0.0125, changePercent24h: -1.96, volume24h: 1500000000, marketCap: 34000000000, type: "crypto" },
  { symbol: "ADA/USDT", name: "Cardano / Tether", price: 0.5823, change24h: 0.0245, changePercent24h: 4.39, volume24h: 650000000, marketCap: 20000000000, type: "crypto" },
  { symbol: "DOGE/USDT", name: "Dogecoin / Tether", price: 0.0892, change24h: 0.0034, changePercent24h: 3.96, volume24h: 890000000, marketCap: 12500000000, type: "crypto" },
  { symbol: "DOT/USDT", name: "Polkadot / Tether", price: 7.45, change24h: -0.23, changePercent24h: -2.99, volume24h: 320000000, marketCap: 9500000000, type: "crypto" },
  { symbol: "BNB/USDT", name: "Binance Coin / Tether", price: 312.50, change24h: 4.80, changePercent24h: 1.56, volume24h: 1200000000, marketCap: 48000000000, type: "crypto" },
  { symbol: "LTC/USDT", name: "Litecoin / Tether", price: 72.30, change24h: 1.15, changePercent24h: 1.62, volume24h: 450000000, marketCap: 5300000000, type: "crypto" },
  { symbol: "AVAX/USDT", name: "Avalanche / Tether", price: 35.80, change24h: 1.92, changePercent24h: 5.67, volume24h: 680000000, marketCap: 13200000000, type: "crypto" },
  { symbol: "LINK/USDT", name: "Chainlink / Tether", price: 14.25, change24h: 0.48, changePercent24h: 3.49, volume24h: 520000000, marketCap: 8400000000, type: "crypto" },
  { symbol: "SHIB/USDT", name: "Shiba Inu / Tether", price: 0.00000912, change24h: 0.00000015, changePercent24h: 1.67, volume24h: 350000000, marketCap: 5400000000, type: "crypto" },
  { symbol: "TRX/USDT", name: "TRON / Tether", price: 0.1035, change24h: 0.0018, changePercent24h: 1.77, volume24h: 290000000, marketCap: 9100000000, type: "crypto" },
  { symbol: "ATOM/USDT", name: "Cosmos / Tether", price: 9.85, change24h: -0.32, changePercent24h: -3.15, volume24h: 210000000, marketCap: 3600000000, type: "crypto" },
  { symbol: "UNI/USDT", name: "Uniswap / Tether", price: 6.42, change24h: 0.21, changePercent24h: 3.38, volume24h: 180000000, marketCap: 4800000000, type: "crypto" },
];

export const defaultForexAssets: Asset[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", price: 1.0845, change24h: 0.0025, changePercent24h: 0.23, volume24h: 125000000000, marketCap: 0, type: "forex" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", price: 1.2650, change24h: -0.0018, changePercent24h: -0.14, volume24h: 85000000000, marketCap: 0, type: "forex" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", price: 148.25, change24h: 0.45, changePercent24h: 0.30, volume24h: 95000000000, marketCap: 0, type: "forex" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", price: 0.8765, change24h: -0.0012, changePercent24h: -0.14, volume24h: 45000000000, marketCap: 0, type: "forex" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", price: 0.6542, change24h: 0.0032, changePercent24h: 0.49, volume24h: 35000000000, marketCap: 0, type: "forex" },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", price: 0.6125, change24h: 0.0015, changePercent24h: 0.25, volume24h: 12000000000, marketCap: 0, type: "forex" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", price: 1.3580, change24h: -0.0022, changePercent24h: -0.16, volume24h: 28000000000, marketCap: 0, type: "forex" },
  { symbol: "EUR/GBP", name: "Euro / British Pound", price: 0.8572, change24h: 0.0010, changePercent24h: 0.12, volume24h: 18000000000, marketCap: 0, type: "forex" },
  { symbol: "USD/SEK", name: "US Dollar / Swedish Krona", price: 10.4250, change24h: 0.0350, changePercent24h: 0.34, volume24h: 8000000000, marketCap: 0, type: "forex" },
  { symbol: "USD/SGD", name: "US Dollar / Singapore Dollar", price: 1.3420, change24h: -0.0008, changePercent24h: -0.06, volume24h: 6000000000, marketCap: 0, type: "forex" },
];

export const defaultStockAssets: Asset[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 185.92, change24h: 2.45, changePercent24h: 1.34, volume24h: 52000000, marketCap: 2900000000000, type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80, change24h: -1.20, changePercent24h: -0.84, volume24h: 23000000, marketCap: 1780000000000, type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.91, change24h: 4.56, changePercent24h: 1.22, volume24h: 18500000, marketCap: 2810000000000, type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.34, change24h: 3.21, changePercent24h: 2.11, volume24h: 41000000, marketCap: 1610000000000, type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.22, change24h: 12.45, changePercent24h: 2.58, volume24h: 45000000, marketCap: 1220000000000, type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.48, change24h: -5.67, changePercent24h: -2.23, volume24h: 98000000, marketCap: 790000000000, type: "stock" },
  { symbol: "META", name: "Meta Platforms", price: 354.76, change24h: 7.89, changePercent24h: 2.27, volume24h: 15000000, marketCap: 920000000000, type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 120.45, change24h: 3.12, changePercent24h: 2.66, volume24h: 31000000, marketCap: 194000000000, type: "stock" },
  { symbol: "INTC", name: "Intel Corp.", price: 42.85, change24h: -0.55, changePercent24h: -1.27, volume24h: 24000000, marketCap: 181000000000, type: "stock" },
  { symbol: "NFLX", name: "Netflix Inc.", price: 485.60, change24h: 8.20, changePercent24h: 1.72, volume24h: 6200000, marketCap: 212000000000, type: "stock" },
  { symbol: "DIS", name: "Walt Disney Co.", price: 92.30, change24h: -1.10, changePercent24h: -1.18, volume24h: 9800000, marketCap: 169000000000, type: "stock" },
  { symbol: "BA", name: "Boeing Co.", price: 215.40, change24h: 4.50, changePercent24h: 2.13, volume24h: 5600000, marketCap: 128000000000, type: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 172.80, change24h: 2.30, changePercent24h: 1.35, volume24h: 8900000, marketCap: 497000000000, type: "stock" },
  { symbol: "V", name: "Visa Inc.", price: 268.50, change24h: 3.80, changePercent24h: 1.44, volume24h: 5400000, marketCap: 552000000000, type: "stock" },
  { symbol: "MA", name: "Mastercard Inc.", price: 420.15, change24h: 5.60, changePercent24h: 1.35, volume24h: 2900000, marketCap: 393000000000, type: "stock" },
  { symbol: "WMT", name: "Walmart Inc.", price: 162.75, change24h: 1.25, changePercent24h: 0.77, volume24h: 6100000, marketCap: 438000000000, type: "stock" },
  { symbol: "KO", name: "Coca-Cola Co.", price: 59.80, change24h: 0.35, changePercent24h: 0.59, volume24h: 11200000, marketCap: 258000000000, type: "stock" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", price: 104.20, change24h: -0.85, changePercent24h: -0.81, volume24h: 14500000, marketCap: 416000000000, type: "stock" },
  { symbol: "PG", name: "Procter & Gamble Co.", price: 153.40, change24h: 0.90, changePercent24h: 0.59, volume24h: 5800000, marketCap: 361000000000, type: "stock" },
  { symbol: "CRM", name: "Salesforce Inc.", price: 265.90, change24h: 6.40, changePercent24h: 2.47, volume24h: 4700000, marketCap: 258000000000, type: "stock" },
];

export const defaultEtfAssets: Asset[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 478.92, change24h: 3.45, changePercent24h: 0.73, volume24h: 65000000, marketCap: 450000000000, type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", price: 405.67, change24h: 5.12, changePercent24h: 1.28, volume24h: 42000000, marketCap: 210000000000, type: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", price: 242.34, change24h: 1.89, changePercent24h: 0.79, volume24h: 4500000, marketCap: 350000000000, type: "etf" },
  { symbol: "IWM", name: "iShares Russell 2000", price: 198.45, change24h: -2.34, changePercent24h: -1.17, volume24h: 28000000, marketCap: 58000000000, type: "etf" },
  { symbol: "GLD", name: "SPDR Gold Shares", price: 189.23, change24h: 0.45, changePercent24h: 0.24, volume24h: 8500000, marketCap: 58000000000, type: "etf" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Avg ETF", price: 382.50, change24h: 2.10, changePercent24h: 0.55, volume24h: 3200000, marketCap: 32000000000, type: "etf" },
  { symbol: "ARKK", name: "ARK Innovation ETF", price: 48.75, change24h: 1.35, changePercent24h: 2.85, volume24h: 18500000, marketCap: 7800000000, type: "etf" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", price: 38.90, change24h: 0.28, changePercent24h: 0.73, volume24h: 42000000, marketCap: 36000000000, type: "etf" },
];

export const defaultAllAssets: Asset[] = [...defaultCryptoAssets, ...defaultForexAssets, ...defaultStockAssets, ...defaultEtfAssets];

export let cryptoAssets: Asset[] = [...defaultCryptoAssets];
export let forexAssets: Asset[] = [...defaultForexAssets];
export let stockAssets: Asset[] = [...defaultStockAssets];
export let etfAssets: Asset[] = [...defaultEtfAssets];
export let allAssets: Asset[] = [...defaultAllAssets];

export interface MarketDataResponse {
  assets: Asset[];
  lastFetchTime: number;
  stale: boolean;
}

export async function fetchMarketData(): Promise<MarketDataResponse | null> {
  try {
    const response = await fetch("/api/market-data");
    if (!response.ok) {
      return null;
    }
    const data = await response.json() as MarketDataResponse;
    
    if (data.assets && data.assets.length > 0) {
      const crypto: Asset[] = [];
      const forex: Asset[] = [];
      const stocks: Asset[] = [];
      const etfs: Asset[] = [];
      
      for (const asset of data.assets) {
        switch (asset.type) {
          case "crypto":
            crypto.push(asset);
            break;
          case "forex":
            forex.push(asset);
            break;
          case "stock":
            stocks.push(asset);
            break;
          case "etf":
            etfs.push(asset);
            break;
        }
      }
      
      if (crypto.length > 0) cryptoAssets = crypto;
      if (forex.length > 0) forexAssets = forex;
      if (stocks.length > 0) stockAssets = stocks;
      if (etfs.length > 0) etfAssets = etfs;
      
      allAssets = [...cryptoAssets, ...forexAssets, ...stockAssets, ...etfAssets];
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching market data:", error);
    return null;
  }
}

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return allAssets.find(a => a.symbol === symbol);
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else if (price >= 0.01) {
    return price.toFixed(4);
  } else {
    return price.toFixed(6);
  }
}

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}

export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return sign + percent.toFixed(2) + "%";
}

export function generatePriceHistory(basePrice: number, points: number = 24): number[] {
  const history: number[] = [];
  let price = basePrice * 0.95;
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.02);
    price = Math.max(price + change, basePrice * 0.8);
    price = Math.min(price, basePrice * 1.2);
    history.push(price);
  }
  history[history.length - 1] = basePrice;
  return history;
}
