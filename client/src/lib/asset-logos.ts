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
  "AAPL": "https://assets.parqet.com/logos/symbol/AAPL?format=png",
  "GOOGL": "https://assets.parqet.com/logos/symbol/GOOGL?format=png",
  "MSFT": "https://assets.parqet.com/logos/symbol/MSFT?format=png",
  "AMZN": "https://assets.parqet.com/logos/symbol/AMZN?format=png",
  "NVDA": "https://assets.parqet.com/logos/symbol/NVDA?format=png",
  "TSLA": "https://assets.parqet.com/logos/symbol/TSLA?format=png",
  "META": "https://assets.parqet.com/logos/symbol/META?format=png",
  "AMD": "https://assets.parqet.com/logos/symbol/AMD?format=png",
  "INTC": "https://assets.parqet.com/logos/symbol/INTC?format=png",
  "NFLX": "https://assets.parqet.com/logos/symbol/NFLX?format=png",
  "DIS": "https://assets.parqet.com/logos/symbol/DIS?format=png",
  "BA": "https://assets.parqet.com/logos/symbol/BA?format=png",
  "JPM": "https://assets.parqet.com/logos/symbol/JPM?format=png",
  "V": "https://assets.parqet.com/logos/symbol/V?format=png",
  "MA": "https://assets.parqet.com/logos/symbol/MA?format=png",
  "WMT": "https://assets.parqet.com/logos/symbol/WMT?format=png",
  "KO": "https://assets.parqet.com/logos/symbol/KO?format=png",
  "XOM": "https://assets.parqet.com/logos/symbol/XOM?format=png",
  "PG": "https://assets.parqet.com/logos/symbol/PG?format=png",
  "CRM": "https://assets.parqet.com/logos/symbol/CRM?format=png",
};

const etfLogos: Record<string, string> = {
  "SPY": "https://assets.parqet.com/logos/symbol/SPY?format=png",
  "QQQ": "https://assets.parqet.com/logos/symbol/QQQ?format=png",
  "VTI": "https://assets.parqet.com/logos/symbol/VTI?format=png",
  "IWM": "https://assets.parqet.com/logos/symbol/IWM?format=png",
  "GLD": "https://assets.parqet.com/logos/symbol/GLD?format=png",
  "DIA": "https://assets.parqet.com/logos/symbol/DIA?format=png",
  "ARKK": "https://assets.parqet.com/logos/symbol/ARKK?format=png",
  "XLF": "https://assets.parqet.com/logos/symbol/XLF?format=png",
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
