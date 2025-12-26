import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

export interface TradeRecord {
  id: string;
  symbol: string;
  name: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  status: string;
  createdAt: string;
  assetType: string;
}

interface TradeHistoryProps {
  trades: TradeRecord[];
  maxHeight?: string;
}

export function TradeHistory({ trades, maxHeight = "400px" }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <GlassCard className="p-6" gradient>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-secondary/20">
            <Clock className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold">Trade History</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No trades yet</p>
          <p className="text-sm text-center">Your trading history will appear here</p>
        </div>
      </GlassCard>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <GlassCard className="p-6" gradient>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-secondary/20">
          <Clock className="w-5 h-5 text-secondary" />
        </div>
        <h3 className="text-lg font-semibold">Trade History</h3>
        <Badge variant="secondary" className="ml-auto">
          {trades.length} trades
        </Badge>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-4">
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              data-testid={`trade-history-${trade.id}`}
              className="flex items-center gap-4 p-4 rounded-lg glass-light"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                trade.type === "buy" 
                  ? "bg-success/20 text-success" 
                  : "bg-destructive/20 text-destructive"
              )}>
                {trade.type === "buy" ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{trade.symbol}</span>
                  <Badge 
                    variant={trade.type === "buy" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {trade.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {trade.quantity.toFixed(trade.assetType === "crypto" ? 6 : 2)} @ ${formatPrice(trade.price)}
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono font-semibold">${formatPrice(trade.total)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(trade.createdAt)}
                </p>
              </div>

              <Badge 
                variant={trade.status === "completed" ? "outline" : "secondary"}
                className="text-xs"
              >
                {trade.status}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}
