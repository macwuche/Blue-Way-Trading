import { useQuery } from "@tanstack/react-query";
import { 
  History as HistoryIcon, ArrowLeft, ArrowUp, ArrowDown,
  Calendar, Filter, TrendingUp, TrendingDown, Clock, Shield, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

interface Position {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  direction: "buy" | "sell";
  orderType: string;
  status: string;
  amount: string;
  volume: string;
  entryPrice: string;
  exitPrice: string | null;
  realizedPnl: string | null;
  adminProfit: string | null;
  closeReason: string | null;
  openedByAdmin: boolean;
  createdAt: string;
  closedAt: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
}

type FilterType = "all" | "user" | "admin";

export default function History() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: closedPositions = [], isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions", "closed"],
    queryFn: async () => {
      const res = await fetch("/api/positions?status=closed");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filteredPositions = closedPositions.filter(p => {
    if (filter === "user") return !p.openedByAdmin;
    if (filter === "admin") return p.openedByAdmin;
    return true;
  });

  const totalTrades = filteredPositions.length;
  const totalWins = filteredPositions.filter(p => parseFloat(p.realizedPnl || "0") > 0).length;
  const totalLosses = filteredPositions.filter(p => parseFloat(p.realizedPnl || "0") < 0).length;
  const winRate = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(1) : "0";

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-background to-background/95">
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
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              data-testid="filter-all"
              className="text-xs"
            >
              All ({closedPositions.length})
            </Button>
            <Button
              variant={filter === "user" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("user")}
              data-testid="filter-user"
              className="text-xs"
            >
              <User className="w-3 h-3 mr-1" />
              My Trades ({closedPositions.filter(p => !p.openedByAdmin).length})
            </Button>
            <Button
              variant={filter === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("admin")}
              data-testid="filter-admin"
              className="text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Managed ({closedPositions.filter(p => p.openedByAdmin).length})
            </Button>
          </div>

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
            ) : filteredPositions.length === 0 ? (
              <Card className="glass-card p-8 text-center" data-testid="empty-trades">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No trades yet</p>
                <p className="text-sm text-muted-foreground/70">Your trade history will appear here</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredPositions.map((position) => {
                  const pnl = parseFloat(position.realizedPnl || "0");
                  const isWin = pnl > 0;
                  const isBuy = position.direction === "buy";
                  
                  return (
                    <Card 
                      key={position.id} 
                      className="glass-card p-4"
                      data-testid={`card-trade-${position.id}`}
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
                              {position.symbol}
                              <Badge 
                                variant={isWin ? "default" : "destructive"}
                                className={cn(
                                  "text-xs",
                                  isWin ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                )}
                              >
                                {pnl === 0 ? "BREAK EVEN" : isWin ? "WIN" : "LOSS"}
                              </Badge>
                              {position.openedByAdmin && (
                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Managed
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {position.closedAt 
                                ? format(new Date(position.closedAt), "MMM d, h:mm a")
                                : format(new Date(position.createdAt), "MMM d, h:mm a")
                              }
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-medium",
                            pnl === 0 ? "text-muted-foreground" : isWin ? "text-success" : "text-destructive"
                          )}>
                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {position.volume} lots @ ${parseFloat(position.entryPrice).toFixed(2)}
                          </div>
                          {position.closeReason && (
                            <div className="text-xs text-muted-foreground/70 capitalize">
                              {position.closeReason.replace(/_/g, " ")}
                            </div>
                          )}
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
