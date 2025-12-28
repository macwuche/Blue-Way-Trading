import { useQuery } from "@tanstack/react-query";
import { 
  History as HistoryIcon, ArrowLeft, ArrowUp, ArrowDown,
  Calendar, Filter, TrendingUp, TrendingDown, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Trade {
  id: number;
  symbol: string;
  name: string;
  assetType: string;
  type: "buy" | "sell";
  quantity: string;
  price: string;
  total: string;
  status: string;
  createdAt: string;
}

interface TradesData {
  trades: Trade[];
}

export default function History() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<TradesData>({
    queryKey: ["/api/trades"],
    retry: false,
  });

  const trades = data?.trades || [];

  const mockTrades: Trade[] = trades.length > 0 ? trades : [
    { id: 1, symbol: "BTC/USD", name: "Bitcoin", assetType: "crypto", type: "buy", quantity: "100", price: "43150", total: "100", status: "win", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, symbol: "EUR/USD", name: "Euro/Dollar", assetType: "forex", type: "sell", quantity: "50", price: "1.0920", total: "50", status: "loss", createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, symbol: "AAPL", name: "Apple Inc", assetType: "stock", type: "buy", quantity: "75", price: "185.50", total: "75", status: "win", createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: 4, symbol: "ETH/USD", name: "Ethereum", assetType: "crypto", type: "buy", quantity: "200", price: "2340", total: "200", status: "win", createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: 5, symbol: "GBP/USD", name: "Pound/Dollar", assetType: "forex", type: "sell", quantity: "150", price: "1.2680", total: "150", status: "loss", createdAt: new Date(Date.now() - 18000000).toISOString() },
  ];

  const totalWins = mockTrades.filter(t => t.status === "win").length;
  const totalLosses = mockTrades.filter(t => t.status === "loss").length;
  const winRate = mockTrades.length > 0 ? (totalWins / mockTrades.length * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Trade History</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-filter">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card p-3 text-center">
              <div className="text-2xl font-bold text-success" data-testid="text-total-wins">{totalWins}</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </Card>
            <Card className="glass-card p-3 text-center">
              <div className="text-2xl font-bold text-destructive" data-testid="text-total-losses">{totalLosses}</div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </Card>
            <Card className="glass-card p-3 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-win-rate">{winRate}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Recent Trades</h2>
            {isLoading ? (
              <div className="space-y-3" data-testid="loading-trades">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="glass-card p-4 animate-pulse">
                    <div className="h-16 bg-muted/20 rounded" />
                  </Card>
                ))}
              </div>
            ) : mockTrades.length === 0 ? (
              <Card className="glass-card p-8 text-center" data-testid="empty-trades">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No trades yet</p>
                <p className="text-sm text-muted-foreground/70">Your trade history will appear here</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {mockTrades.map((trade) => {
                  const isWin = trade.status === "win";
                  const isBuy = trade.type === "buy";
                  
                  return (
                    <Card 
                      key={trade.id} 
                      className="glass-card p-4"
                      data-testid={`card-trade-${trade.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isBuy ? "bg-success/10" : "bg-destructive/10"
                          )}>
                            {isBuy ? (
                              <ArrowUp className={cn("w-5 h-5", "text-success")} />
                            ) : (
                              <ArrowDown className={cn("w-5 h-5", "text-destructive")} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {trade.symbol}
                              <Badge 
                                variant={isWin ? "default" : "destructive"}
                                className={cn(
                                  "text-xs",
                                  isWin ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                )}
                              >
                                {isWin ? "WIN" : "LOSS"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(trade.createdAt), "MMM d, h:mm a")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-medium",
                            isWin ? "text-success" : "text-destructive"
                          )}>
                            {isWin ? "+" : "-"}${parseFloat(trade.total).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isBuy ? "HIGHER" : "LOWER"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
