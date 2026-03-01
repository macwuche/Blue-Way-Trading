const cryptoLogos: Record<string, string> = {
  "BTC": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  "ETH": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  "SOL": "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  "XRP": "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  "ADA": "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  "DOGE": "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  "DOT": "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  "BNB": "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  "LTC": "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  "AVAX": "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  "LINK": "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  "SHIB": "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
  "TRX": "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  "ATOM": "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
  "UNI": "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
};

const stockLogos: Record<string, string> = {
  "AAPL": "https://logo.clearbit.com/apple.com",
  "GOOGL": "https://logo.clearbit.com/google.com",
  "MSFT": "https://logo.clearbit.com/microsoft.com",
  "AMZN": "https://logo.clearbit.com/amazon.com",
  "NVDA": "https://logo.clearbit.com/nvidia.com",
  "TSLA": "https://logo.clearbit.com/tesla.com",
  "META": "https://logo.clearbit.com/meta.com",
  "AMD": "https://logo.clearbit.com/amd.com",
  "INTC": "https://logo.clearbit.com/intel.com",
  "NFLX": "https://logo.clearbit.com/netflix.com",
  "DIS": "https://logo.clearbit.com/disney.com",
  "BA": "https://logo.clearbit.com/boeing.com",
  "JPM": "https://logo.clearbit.com/jpmorganchase.com",
  "V": "https://logo.clearbit.com/visa.com",
  "MA": "https://logo.clearbit.com/mastercard.com",
  "WMT": "https://logo.clearbit.com/walmart.com",
  "KO": "https://logo.clearbit.com/coca-cola.com",
  "XOM": "https://logo.clearbit.com/exxonmobil.com",
  "PG": "https://logo.clearbit.com/pg.com",
  "CRM": "https://logo.clearbit.com/salesforce.com",
};

const etfLogos: Record<string, string> = {
  "SPY": "https://logo.clearbit.com/ssga.com",
  "QQQ": "https://logo.clearbit.com/invesco.com",
  "VTI": "https://logo.clearbit.com/vanguard.com",
  "IWM": "https://logo.clearbit.com/ishares.com",
  "GLD": "https://logo.clearbit.com/ssga.com",
  "DIA": "https://logo.clearbit.com/ssga.com",
  "ARKK": "https://logo.clearbit.com/ark-invest.com",
  "XLF": "https://logo.clearbit.com/ssga.com",
};

const forexFlags: Record<string, string> = {
  "EUR": "https://flagcdn.com/w40/eu.png",
  "USD": "https://flagcdn.com/w40/us.png",
  "GBP": "https://flagcdn.com/w40/gb.png",
  "JPY": "https://flagcdn.com/w40/jp.png",
  "CHF": "https://flagcdn.com/w40/ch.png",
  "AUD": "https://flagcdn.com/w40/au.png",
  "NZD": "https://flagcdn.com/w40/nz.png",
  "CAD": "https://flagcdn.com/w40/ca.png",
  "SEK": "https://flagcdn.com/w40/se.png",
  "SGD": "https://flagcdn.com/w40/sg.png",
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
