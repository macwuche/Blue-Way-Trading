import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Asset, 
  fetchMarketData, 
  allAssets as staticAllAssets,
  cryptoAssets as staticCryptoAssets,
  forexAssets as staticForexAssets,
  stockAssets as staticStockAssets,
  etfAssets as staticEtfAssets,
} from "@/lib/market-data";

interface UseMarketDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

interface UseMarketDataResult {
  allAssets: Asset[];
  cryptoAssets: Asset[];
  forexAssets: Asset[];
  stockAssets: Asset[];
  etfAssets: Asset[];
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
  getAssetBySymbol: (symbol: string) => Asset | undefined;
}

export function useMarketData(options: UseMarketDataOptions = {}): UseMarketDataResult {
  const { refreshInterval = 5000, enabled = true } = options;
  
  const [allAssets, setAllAssets] = useState<Asset[]>(staticAllAssets);
  const [cryptoAssets, setCryptoAssets] = useState<Asset[]>(staticCryptoAssets);
  const [forexAssets, setForexAssets] = useState<Asset[]>(staticForexAssets);
  const [stockAssets, setStockAssets] = useState<Asset[]>(staticStockAssets);
  const [etfAssets, setEtfAssets] = useState<Asset[]>(staticEtfAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    try {
      const data = await fetchMarketData();
      if (data && data.assets.length > 0) {
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
        
        if (crypto.length > 0) setCryptoAssets(crypto);
        if (forex.length > 0) setForexAssets(forex);
        if (stocks.length > 0) setStockAssets(stocks);
        if (etfs.length > 0) setEtfAssets(etfs);
        
        setAllAssets(data.assets);
        setIsStale(data.stale);
        setLastUpdated(data.lastFetchTime);
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    refetch();
    
    intervalRef.current = setInterval(refetch, refreshInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refreshInterval, refetch]);

  const getAssetBySymbol = useCallback((symbol: string): Asset | undefined => {
    return allAssets.find(a => a.symbol === symbol);
  }, [allAssets]);

  return {
    allAssets,
    cryptoAssets,
    forexAssets,
    stockAssets,
    etfAssets,
    isLoading,
    isStale,
    lastUpdated,
    refetch,
    getAssetBySymbol,
  };
}
