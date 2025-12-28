import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Wallet, History, BarChart3, MessageCircle, Trophy, 
  Settings, Plus, ArrowUp, ArrowDown, Clock, ChevronDown,
  ChevronLeft, ChevronRight, Minus, TrendingUp, TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CandlestickChart } from "@/components/candlestick-chart";
import { MarketModal } from "@/components/market-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Asset, cryptoAssets, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface DashboardData {
  portfolio: {
    id: string;
    balance: string;
    totalProfit: string;
    totalProfitPercent: string;
  };
}

type TimeFrame = "5s" | "10s" | "15s" | "30s" | "1m" | "5m";

const timeFrames: TimeFrame[] = ["5s", "10s", "15s", "30s", "1m", "5m"];

const sidebarItems = [
  { id: "trade", icon: BarChart3, label: "Trade", route: "/" },
  { id: "portfolio", icon: Wallet, label: "Portfolio", route: "/portfolio" },
  { id: "history", icon: History, label: "History", route: "/history" },
  { id: "chat", icon: MessageCircle, label: "Support", route: "/support" },
  { id: "leaderboard", icon: Trophy, label: "Tournament", route: "/tournament" },
  { id: "more", icon: Settings, label: "More", route: "/more" },
];

export default function TradeRoom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [openAssets, setOpenAssets] = useState<Asset[]>([cryptoAssets[0]]);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(cryptoAssets[0]);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [expiration, setExpiration] = useState<TimeFrame>("30s");
  const [amount, setAmount] = useState("1");

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const balance = parseFloat(dashboardData?.portfolio?.balance || "10000");

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
        title: "Trade Placed",
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

  const handleSelectAsset = (asset: Asset) => {
    if (!openAssets.find(a => a.symbol === asset.symbol)) {
      setOpenAssets([...openAssets, asset]);
    }
    setSelectedAsset(asset);
    setMarketModalOpen(false);
  };

  const handleCloseAssetTab = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAssets = openAssets.filter(a => a.symbol !== asset.symbol);
    setOpenAssets(newAssets);
    if (selectedAsset.symbol === asset.symbol && newAssets.length > 0) {
      setSelectedAsset(newAssets[0]);
    }
  };

  const handleTrade = (direction: "higher" | "lower") => {
    const quantity = parseFloat(amount);
    if (quantity <= 0 || quantity > balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount.",
        variant: "destructive",
      });
      return;
    }

    executeTradeMutation.mutate({
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      assetType: selectedAsset.type,
      type: direction === "higher" ? "buy" : "sell",
      quantity,
      price: selectedAsset.price,
    });
  };

  const currentExpirationIndex = timeFrames.indexOf(expiration);
  
  const handlePrevExpiration = () => {
    if (currentExpirationIndex > 0) {
      setExpiration(timeFrames[currentExpirationIndex - 1]);
    }
  };

  const handleNextExpiration = () => {
    if (currentExpirationIndex < timeFrames.length - 1) {
      setExpiration(timeFrames[currentExpirationIndex + 1]);
    }
  };

  const handleDecrementAmount = () => {
    const current = parseFloat(amount) || 0;
    if (current > 1) {
      setAmount((current - 1).toString());
    }
  };

  const handleIncrementAmount = () => {
    const current = parseFloat(amount) || 0;
    setAmount((current + 1).toString());
  };

  const profitPercent = 87;
  const potentialProfit = (parseFloat(amount) * (profitPercent / 100)).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a]">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-16 border-r border-white/10 flex-col items-center py-4 glass-dark">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#FF5722] flex items-center justify-center mb-6">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>

        <nav className="flex-1 flex flex-col items-center gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setLocation(item.route)}
              data-testid={`sidebar-${item.id}`}
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200",
                item.id === "trade"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover-elevate"
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-xs font-medium">
            5m
          </div>
          <div className="w-10 h-10 rounded-full glass-light flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-xs font-medium">
            3h
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <header className="flex items-center justify-between gap-2 px-3 h-14 border-b border-white/10 md:hidden">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <div className="text-lg font-bold text-success">${formatPrice(balance)}</div>
            <div className="text-xs text-muted-foreground">Demo account</div>
          </div>

          <Button size="sm" className="bg-[#FF9800] hover:bg-[#FF9800]/90">
            <Wallet className="w-4 h-4" />
          </Button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center gap-2 px-2 h-14 border-b border-white/10">
          <div className="flex items-center gap-1 overflow-x-auto">
            {openAssets.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                data-testid={`tab-${asset.symbol}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                  selectedAsset.symbol === asset.symbol
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover-elevate"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs text-white">
                  {asset.symbol.slice(0, 2)}
                </div>
                <span>{asset.symbol}</span>
                <span className="text-xs opacity-70">{asset.type}</span>
                {openAssets.length > 1 && (
                  <button
                    onClick={(e) => handleCloseAssetTab(asset, e)}
                    className="ml-1 hover:text-white"
                  >
                    x
                  </button>
                )}
              </button>
            ))}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMarketModalOpen(true)}
              data-testid="button-add-asset"
              className="ml-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="glass-light rounded-lg px-3 py-2 flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">PRACTICE ACCOUNT</span>
            </div>
            <div className="text-xl font-bold text-success">
              ${formatPrice(balance)}
            </div>
            <Button size="sm" className="bg-success hover:bg-success/90">
              Deposit
            </Button>
          </div>
        </header>

        {/* Mobile Asset Tabs */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 overflow-x-auto md:hidden">
          {openAssets.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              data-testid={`mobile-tab-${asset.symbol}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                selectedAsset.symbol === asset.symbol
                  ? "bg-[#2C3E50] text-white"
                  : "glass-light text-muted-foreground"
              )}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs text-white">
                {asset.symbol.slice(0, 2)}
              </div>
              <span>{asset.symbol}</span>
              {openAssets.length > 1 && (
                <button
                  onClick={(e) => handleCloseAssetTab(asset, e)}
                  className="ml-1 hover:text-white"
                >
                  x
                </button>
              )}
            </button>
          ))}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMarketModalOpen(true)}
            data-testid="button-add-asset-mobile"
            className="rounded-full"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Desktop Asset Selector */}
            <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-white/10">
              <button
                onClick={() => setMarketModalOpen(true)}
                data-testid="button-change-asset"
                className="flex items-center gap-2 hover-elevate rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm text-white font-bold">
                  {selectedAsset.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {selectedAsset.symbol} (OTC)
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedAsset.type}</div>
                </div>
              </button>
            </div>

            {/* Chart */}
            <div className="flex-1 relative p-2 min-h-[200px]">
              <CandlestickChart
                symbol={selectedAsset.symbol}
                currentPrice={selectedAsset.price}
                isPositive={selectedAsset.changePercent24h >= 0}
              />

              <div className="absolute bottom-4 right-4 glass-dark rounded-lg px-3 py-2 text-right">
                <div className="text-xl md:text-2xl font-mono font-bold">
                  {formatPrice(selectedAsset.price)}
                </div>
              </div>
            </div>

            {/* Desktop Bid/Ask */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">ask</span>
                <span className="font-mono text-sm">{formatPrice(selectedAsset.price * 1.0001)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">bid</span>
                <span className="font-mono text-sm">{formatPrice(selectedAsset.price * 0.9999)}</span>
              </div>
            </div>
          </div>

          {/* Desktop Trading Panel */}
          <div className="hidden md:flex w-64 border-l border-white/10 flex-col p-4 glass-dark">
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Expiration</span>
              </div>
              <div className="glass-light rounded-lg p-2 flex items-center justify-between">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <select
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value as TimeFrame)}
                  data-testid="select-expiration"
                  className="bg-transparent text-lg font-semibold flex-1 text-center outline-none"
                >
                  {timeFrames.map((tf) => (
                    <option key={tf} value={tf} className="bg-[#2C2C2E]">
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Amount</span>
              </div>
              <div className="glass-light rounded-lg p-2 flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                  className="bg-transparent text-xl font-semibold text-center flex-1 outline-none"
                />
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 5, 10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className={cn(
                      "flex-1 py-1 text-xs rounded font-medium transition-all",
                      amount === val.toString()
                        ? "bg-primary text-white"
                        : "glass-light text-muted-foreground"
                    )}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Profit</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-success">+{profitPercent}%</div>
                <div className="text-success text-lg">+${potentialProfit}</div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <Button
                onClick={() => handleTrade("higher")}
                disabled={executeTradeMutation.isPending}
                data-testid="button-higher"
                className="w-full h-16 bg-success hover:bg-success/90 text-white text-lg font-bold flex items-center justify-center gap-3"
              >
                <ArrowUp className="w-6 h-6" />
                HIGHER
              </Button>

              <Button
                onClick={() => handleTrade("lower")}
                disabled={executeTradeMutation.isPending}
                data-testid="button-lower"
                className="w-full h-16 bg-destructive hover:bg-destructive/90 text-white text-lg font-bold flex items-center justify-center gap-3"
              >
                <ArrowDown className="w-6 h-6" />
                LOWER
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Trading Panel - Fixed at bottom */}
        <div className="md:hidden border-t border-white/10 glass-dark p-3 space-y-3">
          {/* Time and Amount Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Time Selector */}
            <div>
              <div className="text-xs text-muted-foreground text-center mb-1">Time</div>
              <div className="glass-light rounded-lg flex items-center justify-between h-12">
                <button 
                  onClick={handlePrevExpiration}
                  data-testid="button-time-prev"
                  className="px-3 h-full flex items-center justify-center text-muted-foreground"
                  disabled={currentExpirationIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold" data-testid="text-expiration-mobile">{expiration}</span>
                <button 
                  onClick={handleNextExpiration}
                  data-testid="button-time-next"
                  className="px-3 h-full flex items-center justify-center text-muted-foreground"
                  disabled={currentExpirationIndex === timeFrames.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Amount Selector */}
            <div>
              <div className="text-xs text-muted-foreground text-center mb-1">Amount ($)</div>
              <div className="glass-light rounded-lg flex items-center justify-between h-12">
                <button 
                  onClick={handleDecrementAmount}
                  data-testid="button-amount-minus"
                  className="px-3 h-full flex items-center justify-center text-muted-foreground"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold" data-testid="text-amount-mobile">{amount}</span>
                <button 
                  onClick={handleIncrementAmount}
                  data-testid="button-amount-plus"
                  className="px-3 h-full flex items-center justify-center text-muted-foreground"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Lower/Higher Buttons Row */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleTrade("lower")}
              disabled={executeTradeMutation.isPending}
              data-testid="button-lower-mobile"
              className="h-14 bg-destructive hover:bg-destructive/90 text-white text-lg font-bold flex items-center justify-center gap-2"
            >
              Lower
              <TrendingDown className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => handleTrade("higher")}
              disabled={executeTradeMutation.isPending}
              data-testid="button-higher-mobile"
              className="h-14 bg-success hover:bg-success/90 text-white text-lg font-bold flex items-center justify-center gap-2"
            >
              Higher
              <TrendingUp className="w-5 h-5" />
            </Button>
          </div>

          {/* Expected Return */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Expected return </span>
            <span className="text-success font-semibold">+${potentialProfit}</span>
            <span className="text-success ml-1">+{profitPercent}%</span>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex items-center justify-around border-t border-white/10 glass-dark py-2 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setLocation(item.route)}
              data-testid={`mobile-nav-${item.id}`}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all min-w-0",
                item.id === "trade"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <MarketModal
        open={marketModalOpen}
        onOpenChange={setMarketModalOpen}
        onSelectAsset={handleSelectAsset}
      />
    </div>
  );
}
