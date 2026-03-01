
export interface MarketSnapshot {
  ticker: string;
  name: string;
  type: "stocks" | "crypto" | "fx" | "indices" | "options";
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  marketStatus: string;
  lastUpdated: number;
}

export interface CachedMarketData {
  stocks: MarketSnapshot[];
  crypto: MarketSnapshot[];
  forex: MarketSnapshot[];
  etfs: MarketSnapshot[];
  lastFetchTime: number;
}

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
const MASSIVE_API_BASE = "https://api.massive.com";
const CACHE_TTL_MS = 5000;

let cachedData: CachedMarketData = {
  stocks: [],
  crypto: [],
  forex: [],
  etfs: [],
  lastFetchTime: 0,
};

let isFetching = false;

const STOCK_TICKERS = [
  "AAPL", "GOOGL", "MSFT", "AMZN", "NVDA", "TSLA", "META",
  "AMD", "INTC", "NFLX", "DIS", "BA", "JPM", "V", "MA",
  "WMT", "KO", "XOM", "PG", "CRM",
];
const ETF_TICKERS = [
  "SPY", "QQQ", "VTI", "IWM", "GLD",
  "DIA", "ARKK", "XLF",
];
const CRYPTO_TICKERS = [
  "X:BTCUSD", "X:ETHUSD", "X:SOLUSD", "X:BNBUSD", "X:XRPUSD", "X:ADAUSD", "X:DOGEUSD", "X:DOTUSD",
  "X:LTCUSD", "X:AVAXUSD", "X:LINKUSD", "X:SHIBUSD", "X:TRXUSD", "X:ATOMUSD", "X:UNIUSD",
];
const FOREX_TICKERS = [
  "C:EURUSD", "C:GBPUSD", "C:USDJPY", "C:USDCHF", "C:AUDUSD",
  "C:NZDUSD", "C:USDCAD", "C:EURGBP", "C:USDSEK", "C:USDSGD",
];

function mapTickerToDisplaySymbol(ticker: string, type: string): string {
  if (type === "crypto") {
    const base = ticker.replace("X:", "").replace("USD", "");
    return `${base}/USDT`;
  }
  if (type === "forex") {
    const pair = ticker.replace("C:", "");
    return `${pair.slice(0, 3)}/${pair.slice(3)}`;
  }
  return ticker;
}

function mapTickerToName(ticker: string, type: string): string {
  const names: Record<string, string> = {
    "AAPL": "Apple Inc.",
    "GOOGL": "Alphabet Inc.",
    "MSFT": "Microsoft Corp.",
    "AMZN": "Amazon.com Inc.",
    "NVDA": "NVIDIA Corp.",
    "TSLA": "Tesla Inc.",
    "META": "Meta Platforms",
    "AMD": "Advanced Micro Devices",
    "INTC": "Intel Corp.",
    "NFLX": "Netflix Inc.",
    "DIS": "Walt Disney Co.",
    "BA": "Boeing Co.",
    "JPM": "JPMorgan Chase & Co.",
    "V": "Visa Inc.",
    "MA": "Mastercard Inc.",
    "WMT": "Walmart Inc.",
    "KO": "Coca-Cola Co.",
    "XOM": "Exxon Mobil Corp.",
    "PG": "Procter & Gamble Co.",
    "CRM": "Salesforce Inc.",
    "SPY": "SPDR S&P 500 ETF",
    "QQQ": "Invesco QQQ Trust",
    "VTI": "Vanguard Total Stock Market",
    "IWM": "iShares Russell 2000",
    "GLD": "SPDR Gold Shares",
    "DIA": "SPDR Dow Jones Industrial Avg ETF",
    "ARKK": "ARK Innovation ETF",
    "XLF": "Financial Select Sector SPDR Fund",
    "X:BTCUSD": "Bitcoin / Tether",
    "X:ETHUSD": "Ethereum / Tether",
    "X:SOLUSD": "Solana / Tether",
    "X:BNBUSD": "Binance Coin / Tether",
    "X:XRPUSD": "Ripple / Tether",
    "X:ADAUSD": "Cardano / Tether",
    "X:DOGEUSD": "Dogecoin / Tether",
    "X:DOTUSD": "Polkadot / Tether",
    "X:LTCUSD": "Litecoin / Tether",
    "X:AVAXUSD": "Avalanche / Tether",
    "X:LINKUSD": "Chainlink / Tether",
    "X:SHIBUSD": "Shiba Inu / Tether",
    "X:TRXUSD": "TRON / Tether",
    "X:ATOMUSD": "Cosmos / Tether",
    "X:UNIUSD": "Uniswap / Tether",
    "C:EURUSD": "Euro / US Dollar",
    "C:GBPUSD": "British Pound / US Dollar",
    "C:USDJPY": "US Dollar / Japanese Yen",
    "C:USDCHF": "US Dollar / Swiss Franc",
    "C:AUDUSD": "Australian Dollar / US Dollar",
    "C:NZDUSD": "New Zealand Dollar / US Dollar",
    "C:USDCAD": "US Dollar / Canadian Dollar",
    "C:EURGBP": "Euro / British Pound",
    "C:USDSEK": "US Dollar / Swedish Krona",
    "C:USDSGD": "US Dollar / Singapore Dollar",
  };
  return names[ticker] || ticker;
}

let apiKeyWarningLogged = false;

async function fetchSnapshotByTicker(ticker: string): Promise<MarketSnapshot | null> {
  if (!MASSIVE_API_KEY) {
    if (!apiKeyWarningLogged) {
      console.warn("[Massive API] MASSIVE_API_KEY not set - using fallback static data");
      apiKeyWarningLogged = true;
    }
    return null;
  }

  try {
    const url = `${MASSIVE_API_BASE}/v3/snapshot?ticker=${encodeURIComponent(ticker)}&limit=1&apiKey=${MASSIVE_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Massive API] Failed to fetch ${ticker}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json() as any;
    
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      console.warn(`[Massive API] No results for ${ticker}`);
      return null;
    }

    const result = data.results[0];
    if (result.error) {
      console.warn(`[Massive API] Error for ${ticker}: ${result.error}`);
      return null;
    }

    const session = result.session || {};
    const lastTrade = result.last_trade || {};
    
    return {
      ticker: result.ticker,
      name: result.name || mapTickerToName(result.ticker, result.type),
      type: result.type,
      price: session.price || lastTrade.price || session.close || 0,
      previousClose: session.previous_close || 0,
      change: session.change || 0,
      changePercent: session.change_percent || 0,
      volume: session.volume || 0,
      high: session.high || 0,
      low: session.low || 0,
      open: session.open || 0,
      marketStatus: result.market_status || "unknown",
      lastUpdated: session.last_updated || Date.now() * 1000000,
    };
  } catch (error) {
    return null;
  }
}

async function fetchSnapshotsFromMassive(tickers: string[]): Promise<MarketSnapshot[]> {
  if (!MASSIVE_API_KEY) {
    console.error("MASSIVE_API_KEY not configured");
    return [];
  }

  const results: MarketSnapshot[] = [];
  
  const fetchPromises = tickers.map(ticker => fetchSnapshotByTicker(ticker));
  const snapshots = await Promise.all(fetchPromises);
  
  for (const snapshot of snapshots) {
    if (snapshot) {
      results.push(snapshot);
    }
  }

  return results;
}

async function refreshMarketData(): Promise<void> {
  if (isFetching) return;
  isFetching = true;

  try {
    const allTickers = [...STOCK_TICKERS, ...ETF_TICKERS, ...CRYPTO_TICKERS, ...FOREX_TICKERS];
    const snapshots = await fetchSnapshotsFromMassive(allTickers);
    
    const stocks: MarketSnapshot[] = [];
    const crypto: MarketSnapshot[] = [];
    const forex: MarketSnapshot[] = [];
    const etfs: MarketSnapshot[] = [];

    for (const snapshot of snapshots) {
      if (STOCK_TICKERS.includes(snapshot.ticker)) {
        stocks.push(snapshot);
      } else if (ETF_TICKERS.includes(snapshot.ticker)) {
        etfs.push(snapshot);
      } else if (snapshot.ticker.startsWith("X:")) {
        crypto.push(snapshot);
      } else if (snapshot.ticker.startsWith("C:")) {
        forex.push(snapshot);
      }
    }

    cachedData = {
      stocks,
      crypto,
      forex,
      etfs,
      lastFetchTime: Date.now(),
    };

    console.log(`[Massive API] Refreshed market data: ${snapshots.length} assets`);
  } catch (error) {
    console.error("Error refreshing market data:", error);
  } finally {
    isFetching = false;
  }
}

export function getCachedMarketData(): CachedMarketData {
  return cachedData;
}

export function isCacheStale(): boolean {
  return Date.now() - cachedData.lastFetchTime > CACHE_TTL_MS;
}

export async function getMarketData(): Promise<CachedMarketData> {
  if (isCacheStale() && !isFetching) {
    await refreshMarketData();
  }
  return cachedData;
}

export interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  type: "crypto" | "forex" | "stock" | "etf";
}

export function convertSnapshotToAsset(snapshot: MarketSnapshot, category: "crypto" | "forex" | "stock" | "etf"): AssetData {
  return {
    symbol: mapTickerToDisplaySymbol(snapshot.ticker, category === "crypto" ? "crypto" : category === "forex" ? "forex" : "stock"),
    name: snapshot.name || mapTickerToName(snapshot.ticker, category),
    price: snapshot.price,
    change24h: snapshot.change,
    changePercent24h: snapshot.changePercent,
    volume24h: snapshot.volume,
    marketCap: 0,
    type: category,
  };
}

export function getAllAssetsFromCache(): AssetData[] {
  const data = cachedData;
  const assets: AssetData[] = [];

  for (const s of data.stocks) {
    assets.push(convertSnapshotToAsset(s, "stock"));
  }
  for (const s of data.etfs) {
    assets.push(convertSnapshotToAsset(s, "etf"));
  }
  for (const s of data.crypto) {
    assets.push(convertSnapshotToAsset(s, "crypto"));
  }
  for (const s of data.forex) {
    assets.push(convertSnapshotToAsset(s, "forex"));
  }

  return assets;
}

let refreshInterval: NodeJS.Timeout | null = null;

export function startMarketDataRefresh(intervalMs: number = 5000): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshMarketData();
  
  refreshInterval = setInterval(() => {
    refreshMarketData();
  }, intervalMs);

  console.log(`[Massive API] Started market data refresh every ${intervalMs / 1000}s`);
}

export function stopMarketDataRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
