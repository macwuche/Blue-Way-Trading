import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { type Asset, formatPrice, formatLargeNumber } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface AssetInfoPanelProps {
  asset: Asset;
  profitPercent?: number;
  potentialProfit?: string;
  className?: string;
}

const getAssetTypeLabel = (type: Asset["type"]) => {
  switch (type) {
    case "crypto":
      return "Spot • Crypto";
    case "forex":
      return "Spot • Forex";
    case "stock":
      return "Stock • Equity";
    case "etf":
      return "ETF • Fund";
    default:
      return "Asset";
  }
};

const getExchange = (type: Asset["type"]) => {
  switch (type) {
    case "crypto":
      return "BINANCE";
    case "forex":
      return "FOREX";
    case "stock":
      return "NASDAQ";
    case "etf":
      return "NYSE";
    default:
      return "MARKET";
  }
};

const getCurrencyUnit = (type: Asset["type"]) => {
  switch (type) {
    case "crypto":
      return "USDT";
    case "forex":
      return "";
    case "stock":
      return "USD";
    case "etf":
      return "USD";
    default:
      return "USD";
  }
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generatePerformanceData = (changePercent: number, symbol: string) => {
  const baseChange = changePercent;
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return [
    { label: "1W", value: (baseChange * 0.5 + (seededRandom(symbolSeed + 1) - 0.5) * 2).toFixed(2) },
    { label: "1M", value: (baseChange * 1.5 + (seededRandom(symbolSeed + 2) - 0.5) * 5).toFixed(2) },
    { label: "3M", value: (baseChange * 3 + (seededRandom(symbolSeed + 3) - 0.5) * 15).toFixed(2) },
    { label: "6M", value: (baseChange * 5 + (seededRandom(symbolSeed + 4) - 0.5) * 20).toFixed(2) },
    { label: "YTD", value: (baseChange * 2 + (seededRandom(symbolSeed + 5) - 0.5) * 10).toFixed(2) },
    { label: "1Y", value: (baseChange * 8 + (seededRandom(symbolSeed + 6) - 0.5) * 25).toFixed(2) },
  ];
};

export function AssetInfoPanel({ asset, profitPercent, potentialProfit, className }: AssetInfoPanelProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const performanceData = useMemo(
    () => generatePerformanceData(asset.changePercent24h, asset.symbol),
    [asset.changePercent24h, asset.symbol]
  );
  const isPositive = asset.changePercent24h >= 0;
  const avgVolume30d = useMemo(() => {
    const symbolSeed = asset.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return asset.volume24h * (0.8 + seededRandom(symbolSeed + 100) * 0.4);
  }, [asset.volume24h, asset.symbol]);
  
  const slides = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Key Stats" },
    { id: "performance", label: "Performance" },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className={cn("glass-light rounded-lg overflow-hidden", className)}>
      <div className="relative">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <button 
            onClick={prevSlide}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            data-testid="button-asset-info-prev"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex gap-2">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentSlide === idx ? "bg-primary" : "bg-white/20"
                )}
                data-testid={`button-slide-${slide.id}`}
              />
            ))}
          </div>
          <button 
            onClick={nextSlide}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            data-testid="button-asset-info-next"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="w-full flex-shrink-0 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold">
                  {asset.symbol.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{asset.symbol}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {asset.name} • {getExchange(asset.type)}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {getAssetTypeLabel(asset.type)}
              </div>
              
              <div>
                <div className="text-2xl font-bold">
                  {formatPrice(asset.price)} 
                  <span className="text-sm text-muted-foreground ml-1">{getCurrencyUnit(asset.type)}</span>
                </div>
                <div className={cn(
                  "text-sm",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? "+" : ""}{asset.change24h.toFixed(2)} {isPositive ? "+" : ""}{asset.changePercent24h.toFixed(2)}%
                </div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-success">Market open</span>
                </div>
              </div>
              
              {(profitPercent !== undefined && potentialProfit !== undefined) && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Expected return</span>
                    <div className="text-right">
                      <span className="text-success font-bold">+{profitPercent}%</span>
                      <span className="text-success text-sm ml-2">+${potentialProfit}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full flex-shrink-0 p-3 space-y-3">
              <div className="text-sm font-semibold">Key stats</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Volume</span>
                  <span className="text-sm font-medium">{formatLargeNumber(asset.volume24h)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Volume (30D)</span>
                  <span className="text-sm font-medium">{formatLargeNumber(avgVolume30d)}</span>
                </div>
                {asset.marketCap > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Market Cap</span>
                    <span className="text-sm font-medium">{formatLargeNumber(asset.marketCap)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">24h Change</span>
                  <span className={cn(
                    "text-sm font-medium",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? "+" : ""}{asset.changePercent24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full flex-shrink-0 p-3 space-y-3">
              <div className="text-sm font-semibold">Performance</div>
              <div className="grid grid-cols-3 gap-2">
                {performanceData.map((item) => {
                  const value = parseFloat(item.value);
                  const positive = value >= 0;
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "rounded-lg p-2 text-center",
                        positive 
                          ? "bg-success/20 border border-success/30" 
                          : "bg-destructive/20 border border-destructive/30"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-bold",
                        positive ? "text-success" : "text-destructive"
                      )}>
                        {positive ? "+" : ""}{item.value}%
                      </div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
