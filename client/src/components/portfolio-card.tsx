import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { formatPrice, formatPercent } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface PortfolioCardProps {
  balance: number;
  totalProfit: number;
  totalProfitPercent: number;
  portfolioValue: number;
}

export function PortfolioCard({ balance, totalProfit, totalProfitPercent, portfolioValue }: PortfolioCardProps) {
  const isPositive = totalProfit >= 0;
  const totalValue = balance + portfolioValue;

  return (
    <GlassCard className="p-6" gradient>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Portfolio Overview</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-3xl font-bold font-mono">${formatPrice(totalValue)}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
          <div className={cn(
            "flex items-center gap-2",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-2xl font-bold font-mono">
              {isPositive ? "+" : ""}{formatPrice(totalProfit)}
            </span>
            <span className="text-sm font-medium">
              ({formatPercent(totalProfitPercent)})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/30">
        <div className="glass-light rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cash</span>
          </div>
          <p className="text-lg font-bold font-mono">${formatPrice(balance)}</p>
        </div>
        
        <div className="glass-light rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Invested</span>
          </div>
          <p className="text-lg font-bold font-mono">${formatPrice(portfolioValue)}</p>
        </div>
      </div>
    </GlassCard>
  );
}

interface HoldingRowProps {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  type: string;
}

export function HoldingRow({ symbol, name, quantity, avgPrice, currentPrice, type }: HoldingRowProps) {
  const value = quantity * currentPrice;
  const cost = quantity * avgPrice;
  const profit = value - cost;
  const profitPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;
  const isPositive = profit >= 0;

  const typeColors: Record<string, string> = {
    crypto: "bg-chart-1/20 text-chart-1",
    forex: "bg-chart-2/20 text-chart-2",
    stock: "bg-chart-3/20 text-chart-3",
    etf: "bg-chart-5/20 text-chart-5",
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg glass-light" data-testid={`holding-row-${symbol}`}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
        typeColors[type] || "bg-muted text-muted-foreground"
      )}>
        {symbol.slice(0, 2)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{symbol}</p>
        <p className="text-sm text-muted-foreground truncate">{name}</p>
      </div>

      <div className="text-right">
        <p className="font-mono font-semibold">${formatPrice(value)}</p>
        <p className="text-sm text-muted-foreground font-mono">
          {quantity.toFixed(type === "crypto" ? 6 : 2)} @ ${formatPrice(avgPrice)}
        </p>
      </div>

      <div className={cn(
        "text-right min-w-[80px]",
        isPositive ? "text-success" : "text-destructive"
      )}>
        <p className="font-mono font-semibold">
          {isPositive ? "+" : ""}{formatPrice(profit)}
        </p>
        <p className="text-sm font-mono">
          {formatPercent(profitPercent)}
        </p>
      </div>
    </div>
  );
}
