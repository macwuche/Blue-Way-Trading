import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeRoomSidebar, MobileBottomNav } from "@/components/trade-room-sidebar";
import { TradingTabs } from "@/components/trading-tabs";
import { CandlestickChart } from "@/components/candlestick-chart";
import { BinaryTradingPanel, TradingInfoPanel } from "@/components/binary-trading-panel";
import { MobileTradingControls } from "@/components/mobile-trading-controls";
import { MarketModal } from "@/components/market-modal";
import { TradeHistory, type TradeRecord } from "@/components/trade-history";
import { PortfolioCard, HoldingRow } from "@/components/portfolio-card";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  type Asset, allAssets, cryptoAssets, formatPrice, formatPercent 
} from "@/lib/market-data";
import { cn } from "@/lib/utils";

type NavItem = "portfolio" | "history" | "dashboard" | "support" | "leaderboard" | "more";

interface TradingTab {
  asset: Asset;
  id: string;
}

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

export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [showPanel, setShowPanel] = useState<"chart" | "portfolio" | "history">("chart");
  
  const [tabs, setTabs] = useState<TradingTab[]>(() => [
    { asset: cryptoAssets[0], id: "tab-1" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  const selectedAsset = activeTab?.asset || null;

  const { data: dashboardData, isLoading: dataLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

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
    const newTabId = `tab-${Date.now()}`;
    setTabs(prev => [...prev, { asset, id: newTabId }]);
    setActiveTabId(newTabId);
    setMarketModalOpen(false);
    setShowPanel("chart");
  };

  const handleTabClose = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (newTabs.length === 0) return prev;
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  };

  const handleNavClick = (item: NavItem) => {
    setActiveNav(item);
    if (item === "portfolio") {
      setShowPanel("portfolio");
    } else if (item === "history") {
      setShowPanel("history");
    } else {
      setShowPanel("chart");
    }
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
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
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <TradingTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTabId}
        onTabClose={handleTabClose}
        onAddTab={() => setMarketModalOpen(true)}
        balance={balance}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <TradeRoomSidebar
          activeItem={activeNav}
          onItemClick={handleNavClick}
          onLogout={logout}
        />
        
        {showPanel === "chart" && (
          <>
            <TradingInfoPanel asset={selectedAsset} />
            
            <main className="flex-1 flex flex-col overflow-hidden relative pb-[200px] md:pb-0">
              {selectedAsset && (
                <div className="hidden md:flex absolute top-4 left-4 z-10 items-center gap-3 bg-black/60 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                    {selectedAsset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedAsset.symbol}</span>
                      <span className="text-xs text-muted-foreground">({selectedAsset.type})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">${formatPrice(selectedAsset.price)}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        selectedAsset.changePercent24h >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatPercent(selectedAsset.changePercent24h)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 p-1 md:p-4">
                {selectedAsset ? (
                  <CandlestickChart
                    symbol={selectedAsset.symbol}
                    currentPrice={selectedAsset.price}
                    className="w-full h-full relative"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Select an asset to start trading</p>
                  </div>
                )}
              </div>
            </main>
            
            <BinaryTradingPanel
              asset={selectedAsset}
              balance={balance}
              onTrade={handleExecuteTrade}
              isLoading={executeTradeMutation.isPending}
              className="hidden md:flex"
            />
          </>
        )}
        
        {showPanel === "portfolio" && (
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Portfolio</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPanel("chart")}
                  data-testid="button-close-panel"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
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
          </main>
        )}
        
        {showPanel === "history" && (
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Trade History</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPanel("chart")}
                  data-testid="button-close-history"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <TradeHistory trades={trades} maxHeight="calc(100vh - 200px)" />
            </div>
          </main>
        )}
      </div>
      
      {showPanel === "chart" && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-40">
          <MobileTradingControls
            asset={selectedAsset}
            balance={balance}
            onTrade={handleExecuteTrade}
            isLoading={executeTradeMutation.isPending}
          />
        </div>
      )}
      
      <MobileBottomNav
        activeItem={activeNav}
        onItemClick={handleNavClick}
      />

      <MarketModal
        open={marketModalOpen}
        onOpenChange={setMarketModalOpen}
        onSelectAsset={handleSelectAsset}
      />
    </div>
  );
}
