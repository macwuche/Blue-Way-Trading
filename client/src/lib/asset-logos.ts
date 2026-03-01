const cryptoLogos: Record<string, string> = {
  "BTC": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  "ETH": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  "SOL": "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  "XRP": "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  "ADA": "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  "DOGE": "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  "DOT": "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
};

const stockLogos: Record<string, string> = {
  "AAPL": "https://logo.clearbit.com/apple.com",
  "GOOGL": "https://logo.clearbit.com/google.com",
  "MSFT": "https://logo.clearbit.com/microsoft.com",
  "AMZN": "https://logo.clearbit.com/amazon.com",
  "NVDA": "https://logo.clearbit.com/nvidia.com",
  "TSLA": "https://logo.clearbit.com/tesla.com",
  "META": "https://logo.clearbit.com/meta.com",
};

const etfLogos: Record<string, string> = {
  "SPY": "https://logo.clearbit.com/ssga.com",
  "QQQ": "https://logo.clearbit.com/invesco.com",
  "VTI": "https://logo.clearbit.com/vanguard.com",
  "IWM": "https://logo.clearbit.com/ishares.com",
  "GLD": "https://logo.clearbit.com/ssga.com",
};

const forexFlags: Record<string, string> = {
  "EUR": "https://flagcdn.com/w40/eu.png",
  "USD": "https://flagcdn.com/w40/us.png",
  "GBP": "https://flagcdn.com/w40/gb.png",
  "JPY": "https://flagcdn.com/w40/jp.png",
  "CHF": "https://flagcdn.com/w40/ch.png",
  "AUD": "https://flagcdn.com/w40/au.png",
};

export function getAssetLogoUrl(symbol: string, type: string): string | null {
  if (type === "crypto") {
    const base = symbol.split("/")[0];
    return cryptoLogos[base] || null;
  }
  if (type === "stock") {
    return stockLogos[symbol] || null;
  }
  if (type === "etf") {
    return etfLogos[symbol] || null;
  }
  if (type === "forex") {
    const base = symbol.split("/")[0];
    return forexFlags[base] || null;
  }
  return null;
}

export function getForexPairFlags(symbol: string): { base: string | null; quote: string | null } {
  const parts = symbol.split("/");
  return {
    base: forexFlags[parts[0]] || null,
    quote: forexFlags[parts[1]] || null,
  };
}
