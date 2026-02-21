import { useQuery } from "@tanstack/react-query";
import { 
  Wallet, TrendingUp, TrendingDown, ArrowLeft,
  PieChart, DollarSign, Percent, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface Holding {
  id: number;
  symbol: string;
  name: string;
  assetType: string;
  quantity: string;
  averagePrice: string;
  currentPrice: string;
  profitLoss: string;
  profitLossPercent: string;
}

interface PortfolioData {
  portfolio: {
    id: string;
    balance: string;
    totalProfit: string;
    totalProfitPercent: string;
  };
  holdings: Holding[];
}

export default function Portfolio() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<PortfolioData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const balance = parseFloat(data?.portfolio?.balance || "10000");
  const totalProfit = parseFloat(data?.portfolio?.totalProfit || "0");
  const totalProfitPercent = parseFloat(data?.portfolio?.totalProfitPercent || "0");
  const holdings = data?.holdings || [];

  const totalValue = balance + holdings.reduce((sum, h) => {
    return sum + (parseFloat(h.quantity) * parseFloat(h.currentPrice));
  }, 0);

  const mockHoldings: Holding[] = holdings.length > 0 ? holdings : [
    { id: 1, symbol: "BTC/USD", name: "Bitcoin", assetType: "crypto", quantity: "0.05", averagePrice: "42500", currentPrice: "43250", profitLoss: "37.50", profitLossPercent: "1.76" },
    { id: 2, symbol: "ETH/USD", name: "Ethereum", assetType: "crypto", quantity: "0.5", averagePrice: "2280", currentPrice: "2350", profitLoss: "35.00", profitLossPercent: "3.07" },
    { id: 3, symbol: "EUR/USD", name: "Euro/Dollar", assetType: "forex", quantity: "1000", averagePrice: "1.0850", currentPrice: "1.0920", profitLoss: "7.00", profitLossPercent: "0.64" },
  ];

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
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
            <Wallet className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Portfolio</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
              <PieChart className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-portfolio-value">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm",
              totalProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {totalProfit >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span data-testid="text-portfolio-profit">
                {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)} ({totalProfitPercent >= 0 ? "+" : ""}{totalProfitPercent.toFixed(2)}%)
              </span>
              <span className="text-muted-foreground ml-1">All time</span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Available</span>
              </div>
              <div className="text-xl font-semibold" data-testid="text-available-balance">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <BarChart3 className="w-4 h-4" />
                <span>In Positions</span>
              </div>
              <div className="text-xl font-semibold" data-testid="text-positions-value">
                ${(totalValue - balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Holdings</h2>
            {isLoading ? (
              <div className="space-y-3" data-testid="loading-holdings">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="glass-card p-4 animate-pulse">
                    <div className="h-12 bg-muted/20 rounded" />
                  </Card>
                ))}
              </div>
            ) : mockHoldings.length === 0 ? (
              <Card className="glass-card p-8 text-center" data-testid="empty-holdings">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No holdings yet</p>
                <p className="text-sm text-muted-foreground/70">Start trading to build your portfolio</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {mockHoldings.map((holding) => {
                  const profit = parseFloat(holding.profitLoss);
                  const profitPercent = parseFloat(holding.profitLossPercent);
                  const isPositive = profit >= 0;
                  
                  return (
                    <Card 
                      key={holding.id} 
                      className="glass-card p-4 hover-elevate cursor-pointer"
                      data-testid={`card-holding-${holding.symbol}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {holding.symbol.split("/")[0].slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{holding.symbol}</div>
                            <div className="text-sm text-muted-foreground">{holding.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${(parseFloat(holding.quantity) * parseFloat(holding.currentPrice)).toFixed(2)}
                          </div>
                          <div className={cn(
                            "text-sm flex items-center justify-end gap-1",
                            isPositive ? "text-success" : "text-destructive"
                          )}>
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {isPositive ? "+" : ""}{profitPercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/20 flex justify-between text-sm text-muted-foreground">
                        <span>Qty: {holding.quantity}</span>
                        <span>Avg: ${parseFloat(holding.averagePrice).toLocaleString()}</span>
                        <span>Current: ${parseFloat(holding.currentPrice).toLocaleString()}</span>
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
