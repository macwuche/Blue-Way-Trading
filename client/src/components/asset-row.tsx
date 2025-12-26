import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { type Asset, formatPrice, formatPercent, generatePriceHistory } from "@/lib/market-data";
import { MiniChart } from "./price-chart";
import { cn } from "@/lib/utils";

interface AssetRowProps {
  asset: Asset;
  onClick?: () => void;
  showChart?: boolean;
}

export function AssetRow({ asset, onClick, showChart = true }: AssetRowProps) {
  const isPositive = asset.changePercent24h >= 0;
  
  const chartData = useMemo(() => {
    return generatePriceHistory(asset.price, 12);
  }, [asset.price, asset.symbol]);

  const typeColors: Record<string, string> = {
    crypto: "bg-chart-1/20 text-chart-1",
    forex: "bg-chart-2/20 text-chart-2",
    stock: "bg-chart-3/20 text-chart-3",
    etf: "bg-chart-5/20 text-chart-5",
  };

  return (
    <div
      onClick={onClick}
      data-testid={`asset-row-${asset.symbol}`}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
        onClick && "cursor-pointer hover-elevate"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
          typeColors[asset.type] || "bg-muted text-muted-foreground"
        )}>
          {asset.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{asset.symbol}</p>
          <p className="text-sm text-muted-foreground truncate">{asset.name}</p>
        </div>
      </div>

      {showChart && (
        <div className="hidden sm:block">
          <MiniChart data={chartData} isPositive={isPositive} />
        </div>
      )}

      <div className="text-right">
        <p className="font-mono font-semibold text-foreground">
          ${formatPrice(asset.price)}
        </p>
        <div className={cn(
          "flex items-center justify-end gap-1 text-sm",
          isPositive ? "text-success" : "text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{formatPercent(asset.changePercent24h)}</span>
        </div>
      </div>
    </div>
  );
}
