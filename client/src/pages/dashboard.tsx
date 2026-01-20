import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, TrendingUp, Wallet, History, Star, 
  LogOut, Menu, ChevronDown, Search, Bell, User, BarChart3,
  Clock, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PortfolioCard, HoldingRow } from "@/components/portfolio-card";
import { TradingPanel } from "@/components/trading-panel";
import { PriceChart } from "@/components/price-chart";
import { TradeHistory, type TradeRecord } from "@/components/trade-history";
import { Watchlist } from "@/components/watchlist";
import { MarketModal } from "@/components/market-modal";
import { AssetRow } from "@/components/asset-row";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  type Asset, allAssets, cryptoAssets, formatPrice, formatPercent 
} from "@/lib/market-data";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "markets" | "portfolio" | "history";

interface DashboardData {
  portfolio: {
    id: string;
    balance: string;
    totalProfit: string;
    totalProfitPercent: string;
  };
  holdings: Array<{
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    quantity: string;
    avgBuyPrice: string;
    currentPrice: string;
  }>;
  trades: TradeRecord[];
  watchlist: Array<{
    symbol: string;
    name: string;
    assetType: string;
  }>;
}

interface ActiveUserTrade {
  id: string;
  symbol: string;
  name: string;
  direction: "higher" | "lower";
  amount: string;
  entryPrice: string;
  durationMs: number | null;
  durationGroup: string | null;
  createdAt: string;
  expiryTime: string | null; // Changed from expiresAt to match API
}

export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(cryptoAssets[0]);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tradeCountdowns, setTradeCountdowns] = useState<Record<string, number>>({});

  const { data: dashboardData, isLoading: dataLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  // Fetch active trades for the user
  const { data: activeTrades = [], isLoading: activeTradesLoading } = useQuery<ActiveUserTrade[]>({
    queryKey: ["/api/user/active-trades"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Countdown effect for active trades
  useEffect(() => {
    if (activeTrades.length === 0) return;

    const calculateCountdowns = () => {
      const now = Date.now();
      const newCountdowns: Record<string, number> = {};
      
      activeTrades.forEach(trade => {
        if (trade.expiryTime) {
          const expiryTime = new Date(trade.expiryTime).getTime();
          const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
          newCountdowns[trade.id] = remaining;
        }
      });
      
      setTradeCountdowns(newCountdowns);
    };

    calculateCountdowns();
    const interval = setInterval(calculateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [activeTrades]);

  const formatTradeCountdown = useCallback((seconds: number) => {
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `0:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const executeTradeMutation = useMutation({
    mutationFn: async (data: { 
      symbol: string; 
      name: string; 
      assetType: string;
      type: "buy" | "sell"; 
      quantity: number; 
      price: number;
    }) => {
      const res = await apiRequest("POST", "/api/trades", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Trade Executed",
        description: "Your trade has been successfully executed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecuteTrade = (data: { type: "buy" | "sell"; quantity: number; price: number }) => {
    if (!selectedAsset) return;
    executeTradeMutation.mutate({
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      assetType: selectedAsset.type,
      ...data,
    });
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setMarketModalOpen(false);
  };

  const balance = parseFloat(dashboardData?.portfolio?.balance || "10000");
  const totalProfit = parseFloat(dashboardData?.portfolio?.totalProfit || "0");
  const totalProfitPercent = parseFloat(dashboardData?.portfolio?.totalProfitPercent || "0");
  
  const holdings = dashboardData?.holdings || [];
  const portfolioValue = holdings.reduce((sum, h) => {
    return sum + parseFloat(h.quantity) * parseFloat(h.currentPrice);
  }, 0);

  const trades: TradeRecord[] = (dashboardData?.trades || []).map(t => ({
    ...t,
    quantity: typeof t.quantity === "string" ? parseFloat(t.quantity) : t.quantity,
    price: typeof t.price === "string" ? parseFloat(t.price) : t.price,
    total: typeof t.total === "string" ? parseFloat(t.total) : t.total,
  }));

  const watchlistAssets: Asset[] = (dashboardData?.watchlist || []).map(w => {
    const found = allAssets.find(a => a.symbol === w.symbol);
    return found || {
      symbol: w.symbol,
      name: w.name,
      price: 0,
      change24h: 0,
      changePercent24h: 0,
      volume24h: 0,
      marketCap: 0,
      type: w.assetType as any,
    };
  });

  const navItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "markets" as Tab, label: "Markets", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "portfolio" as Tab, label: "Portfolio", icon: <Wallet className="w-5 h-5" /> },
    { id: "history" as Tab, label: "History", icon: <History className="w-5 h-5" /> },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-40 w-64 glass-dark border-r border-border/30 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-6 border-b border-border/30">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Blue Way Trading</span>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  data-testid={`nav-${item.id}`}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover-elevate"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-3 p-3 rounded-lg glass-light">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user?.firstName || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ""}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 glass border-b border-border/30">
          <div className="flex items-center justify-between gap-4 px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setMarketModalOpen(true)}
                data-testid="button-open-markets"
                className="glass-light border-border/30"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Markets
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {activeTab === "dashboard" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {dataLoading ? (
                  <Skeleton className="h-[200px] rounded-lg" />
                ) : (
                  <PortfolioCard
                    balance={balance}
                    totalProfit={totalProfit}
                    totalProfitPercent={totalProfitPercent}
                    portfolioValue={portfolioValue}
                  />
                )}

                {selectedAsset && (
                  <GlassCard className="p-6" gradient>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {selectedAsset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedAsset.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{selectedAsset.name}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMarketModalOpen(true)}
                        data-testid="button-change-asset"
                        className="glass-light border-border/30"
                      >
                        Change
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <PriceChart
                      symbol={selectedAsset.symbol}
                      currentPrice={selectedAsset.price}
                      changePercent={selectedAsset.changePercent24h}
                    />
                  </GlassCard>
                )}

                {/* Active Trades Section */}
                {activeTrades.length > 0 && (
                  <GlassCard className="p-6" gradient>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Active Trades</h3>
                        <Badge className="bg-primary/20 text-primary ml-2">{activeTrades.length}</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {activeTrades.slice(0, 5).map((trade) => {
                        const countdown = tradeCountdowns[trade.id] || 0;
                        // Calculate progress based on durationMs if available, otherwise estimate from createdAt
                        let progress = 0;
                        if (trade.expiryTime && trade.durationMs && trade.durationMs > 0) {
                          // Use actual duration for accurate progress
                          const totalSeconds = trade.durationMs / 1000;
                          progress = Math.max(0, Math.min(100, (countdown / totalSeconds) * 100));
                        } else if (trade.expiryTime && trade.createdAt) {
                          // Fallback: calculate duration from createdAt to expiryTime
                          const created = new Date(trade.createdAt).getTime();
                          const expires = new Date(trade.expiryTime).getTime();
                          const totalDuration = (expires - created) / 1000;
                          if (totalDuration > 0) {
                            progress = Math.max(0, Math.min(100, (countdown / totalDuration) * 100));
                          }
                        }
                        
                        return (
                          <div
                            key={trade.id}
                            className="glass-light rounded-lg p-3"
                            data-testid={`active-trade-${trade.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  trade.direction === "higher" 
                                    ? "bg-success/20 text-success" 
                                    : "bg-destructive/20 text-destructive"
                                )}>
                                  {trade.direction === "higher" 
                                    ? <ArrowUp className="w-4 h-4" /> 
                                    : <ArrowDown className="w-4 h-4" />
                                  }
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{trade.symbol}</p>
                                  <p className="text-xs text-muted-foreground">{trade.name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">${parseFloat(trade.amount).toLocaleString()}</p>
                                {trade.durationGroup && (
                                  <Badge className="text-[10px] bg-primary/10">{trade.durationGroup}</Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Countdown timer */}
                            <div className="flex items-center gap-2">
                              <Progress value={100 - progress} className="flex-1 h-2" />
                              <span className={cn(
                                "text-sm font-mono font-bold",
                                countdown < 10 ? "text-destructive animate-pulse" : "text-primary"
                              )}>
                                {formatTradeCountdown(countdown)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>Entry: ${parseFloat(trade.entryPrice).toLocaleString()}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded uppercase font-medium",
                                trade.direction === "higher" 
                                  ? "bg-success/20 text-success" 
                                  : "bg-destructive/20 text-destructive"
                              )}>
                                {trade.direction}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {activeTrades.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                          +{activeTrades.length - 5} more active trades
                        </p>
                      )}
                    </div>
                  </GlassCard>
                )}

                <Watchlist
                  items={watchlistAssets.length > 0 ? watchlistAssets : cryptoAssets.slice(0, 4)}
                  onSelectAsset={handleSelectAsset}
                  onAddClick={() => setMarketModalOpen(true)}
                />
              </div>

              <div className="space-y-6">
                <TradingPanel
                  asset={selectedAsset}
                  balance={balance}
                  onExecuteTrade={handleExecuteTrade}
                  isLoading={executeTradeMutation.isPending}
                />

                {dataLoading ? (
                  <Skeleton className="h-[300px] rounded-lg" />
                ) : (
                  <TradeHistory trades={trades.slice(0, 5)} maxHeight="300px" />
                )}
              </div>
            </div>
          )}

          {activeTab === "markets" && (
            <div className="space-y-6">
              <GlassCard className="p-6" gradient>
                <h2 className="text-lg font-semibold mb-4">All Markets</h2>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1">
                    {allAssets.map((asset) => (
                      <AssetRow
                        key={asset.symbol}
                        asset={asset}
                        onClick={() => {
                          handleSelectAsset(asset);
                          setActiveTab("dashboard");
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </GlassCard>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="space-y-6">
              {dataLoading ? (
                <Skeleton className="h-[200px] rounded-lg" />
              ) : (
                <PortfolioCard
                  balance={balance}
                  totalProfit={totalProfit}
                  totalProfitPercent={totalProfitPercent}
                  portfolioValue={portfolioValue}
                />
              )}

              <GlassCard className="p-6" gradient>
                <h2 className="text-lg font-semibold mb-4">Your Holdings</h2>
                {holdings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Wallet className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No holdings yet</p>
                    <p className="text-sm text-center">Start trading to build your portfolio</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {holdings.map((holding) => (
                      <HoldingRow
                        key={holding.id}
                        symbol={holding.symbol}
                        name={holding.name}
                        quantity={parseFloat(holding.quantity)}
                        avgPrice={parseFloat(holding.avgBuyPrice)}
                        currentPrice={parseFloat(holding.currentPrice)}
                        type={holding.assetType}
                      />
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {activeTab === "history" && (
            <TradeHistory trades={trades} maxHeight="calc(100vh - 200px)" />
          )}
        </main>
      </div>

      <MarketModal
        open={marketModalOpen}
        onOpenChange={setMarketModalOpen}
        onSelectAsset={handleSelectAsset}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
