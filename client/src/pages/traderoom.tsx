import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Wallet, History, BarChart3, MessageCircle, Newspaper, 
  Settings, Plus, ArrowUp, ArrowDown, Clock, ChevronDown,
  ChevronLeft, ChevronRight, Minus, TrendingUp, TrendingDown,
  Copy, X, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandlestickChart } from "@/components/candlestick-chart";
import { MarketModal } from "@/components/market-modal";
import { AssetInfoPanel } from "@/components/asset-info-panel";
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

interface ActiveTrade {
  id: string;
  symbol: string;
  direction: "higher" | "lower";
  amount: number;
  entryPrice: number;
  expiryTime: number;
  startTime: number;
}

interface TradeResult {
  isWin: boolean;
  profit: number;
  entryPrice: number;
  exitPrice: number;
  direction: "higher" | "lower";
}

const expiryOptions = [
  { value: "30s", label: "30 seconds", ms: 30000 },
  { value: "1m", label: "1 minute", ms: 60000 },
  { value: "2m", label: "2 minutes", ms: 120000 },
  { value: "3m", label: "3 minutes", ms: 180000 },
  { value: "5m", label: "5 minutes", ms: 300000 },
  { value: "10m", label: "10 minutes", ms: 600000 },
  { value: "15m", label: "15 minutes", ms: 900000 },
  { value: "30m", label: "30 minutes", ms: 1800000 },
  { value: "1h", label: "1 hour", ms: 3600000 },
  { value: "4h", label: "4 hours", ms: 14400000 },
  { value: "1d", label: "1 day", ms: 86400000 },
  { value: "1w", label: "1 week", ms: 604800000 },
  { value: "1mo", label: "1 month", ms: 2592000000 },
  { value: "1y", label: "1 year", ms: 31536000000 },
];

const sidebarItems = [
  { id: "trade", icon: BarChart3, label: "Trade", route: "/" },
  { id: "portfolio", icon: Wallet, label: "Portfolio", route: "/portfolio" },
  { id: "history", icon: History, label: "History", route: "/history" },
  { id: "chat", icon: MessageCircle, label: "Support", route: "/support" },
  { id: "news", icon: Newspaper, label: "News", route: "/news" },
  { id: "vip", icon: Crown, label: "VIP", route: "/vip" },
  { id: "more", icon: Settings, label: "More", route: "/more" },
];

export default function TradeRoom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [openAssets, setOpenAssets] = useState<Asset[]>([cryptoAssets[0]]);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(cryptoAssets[0]);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [expiration, setExpiration] = useState("1m");
  const [amount, setAmount] = useState(10);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

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

  const getExpiryMs = useCallback(() => {
    return expiryOptions.find(o => o.value === expiration)?.ms || 60000;
  }, [expiration]);

  const handleTrade = (direction: "higher" | "lower") => {
    if (activeTrade) return;
    
    if (amount <= 0 || amount > balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount.",
        variant: "destructive",
      });
      return;
    }

    const expiryMs = getExpiryMs();
    const now = Date.now();
    
    const newTrade: ActiveTrade = {
      id: `trade-${now}`,
      symbol: selectedAsset.symbol,
      direction,
      amount,
      entryPrice: selectedAsset.price,
      expiryTime: now + expiryMs,
      startTime: now,
    };
    
    setActiveTrade(newTrade);
    setCountdown(Math.floor(expiryMs / 1000));

    executeTradeMutation.mutate({
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      assetType: selectedAsset.type,
      type: direction === "higher" ? "buy" : "sell",
      quantity: amount,
      price: selectedAsset.price,
    });
  };

  const handleDoubleUp = () => {
    if (!activeTrade) return;
    
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "Not enough balance to double up.",
        variant: "destructive",
      });
      return;
    }

    const newTrade: ActiveTrade = {
      ...activeTrade,
      id: `trade-${Date.now()}`,
      amount: activeTrade.amount,
      entryPrice: selectedAsset.price,
    };
    
    executeTradeMutation.mutate({
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      assetType: selectedAsset.type,
      type: activeTrade.direction === "higher" ? "buy" : "sell",
      quantity: activeTrade.amount,
      price: selectedAsset.price,
    });

    toast({
      title: "Double Up",
      description: `Placed additional ${activeTrade.direction.toUpperCase()} trade for $${activeTrade.amount}`,
    });
  };

  const handleSellEarly = () => {
    if (!activeTrade) return;
    
    const currentPrice = selectedAsset.price;
    const priceChange = currentPrice - activeTrade.entryPrice;
    const isWinning = activeTrade.direction === "higher" ? priceChange > 0 : priceChange < 0;
    
    const timeElapsed = Date.now() - activeTrade.startTime;
    const totalTime = activeTrade.expiryTime - activeTrade.startTime;
    const timeRatio = timeElapsed / totalTime;
    
    const profitPercent = isWinning ? 87 * timeRatio * 0.7 : -100 * timeRatio * 0.5;
    const profit = activeTrade.amount * (profitPercent / 100);
    
    setTradeResult({
      isWin: profit > 0,
      profit,
      entryPrice: activeTrade.entryPrice,
      exitPrice: currentPrice,
      direction: activeTrade.direction,
    });
    
    setActiveTrade(null);
    setCountdown(0);
    setShowResultDialog(true);
  };

  useEffect(() => {
    if (!activeTrade) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeTrade.expiryTime - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        
        const exitPrice = selectedAsset.price + (Math.random() - 0.5) * selectedAsset.price * 0.001;
        const priceChange = exitPrice - activeTrade.entryPrice;
        const isWin = activeTrade.direction === "higher" ? priceChange > 0 : priceChange < 0;
        const profit = isWin ? activeTrade.amount * 0.87 : -activeTrade.amount;
        
        setTradeResult({
          isWin,
          profit,
          entryPrice: activeTrade.entryPrice,
          exitPrice,
          direction: activeTrade.direction,
        });
        
        setActiveTrade(null);
        setShowResultDialog(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTrade, selectedAsset.price]);

  const formatCountdown = (seconds: number) => {
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
  };

  const profitPercent = 87;
  const potentialProfit = (amount * (profitPercent / 100)).toFixed(2);

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

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
            <div className="text-lg font-bold text-success" data-testid="text-balance-mobile">${formatPrice(balance)}</div>
            <div className="text-xs text-muted-foreground">Real account</div>
          </div>

          <Button 
            size="sm" 
            className="bg-[#FF9800] hover:bg-[#FF9800]/90"
            onClick={() => setLocation("/deposit")}
            data-testid="button-deposit-mobile"
          >
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
                    <X className="w-3 h-3" />
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
              <span className="text-sm text-muted-foreground">REAL ACCOUNT</span>
            </div>
            <div className="text-xl font-bold text-success" data-testid="text-balance-desktop">
              ${formatPrice(balance)}
            </div>
            <Button 
              size="sm" 
              className="bg-success hover:bg-success/90"
              onClick={() => setLocation("/deposit")}
              data-testid="button-deposit-desktop"
            >
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
                  <X className="w-3 h-3" />
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

              {/* Active Trade Countdown Overlay */}
              {activeTrade && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className={cn(
                    "glass-dark rounded-xl px-6 py-4 text-center border-2",
                    activeTrade.direction === "higher" ? "border-success" : "border-destructive"
                  )}>
                    <div className="text-sm text-muted-foreground mb-1">
                      {activeTrade.direction.toUpperCase()} - ${activeTrade.amount}
                    </div>
                    <div className={cn(
                      "text-4xl font-bold font-mono",
                      activeTrade.direction === "higher" ? "text-success" : "text-destructive"
                    )} data-testid="text-countdown">
                      {formatCountdown(countdown)}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDoubleUp}
                        data-testid="button-double-up"
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Double Up
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSellEarly}
                        data-testid="button-sell-early"
                        className="text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Sell Early
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 glass-dark rounded-lg px-3 py-2 text-right">
                <div className="text-xl md:text-2xl font-mono font-bold" data-testid="text-current-price">
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
          <div className="hidden md:flex w-72 border-l border-white/10 flex-col p-4 glass-dark">
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Expiration</span>
              </div>
              <Select value={expiration} onValueChange={setExpiration} disabled={!!activeTrade}>
                <SelectTrigger className="glass-light border-0" data-testid="select-expiration">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10">
                  {expiryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Amount</span>
                <span>${amount.toFixed(0)}</span>
              </div>
              <div className="space-y-3">
                <Slider
                  value={[amount]}
                  onValueChange={handleSliderChange}
                  min={1}
                  max={Math.max(1, balance)}
                  step={1}
                  disabled={!!activeTrade}
                  data-testid="slider-amount"
                  className="py-2"
                />
                <div className="glass-light rounded-lg p-2 flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.min(balance, Math.max(1, parseFloat(e.target.value) || 1)))}
                    disabled={!!activeTrade}
                    data-testid="input-amount"
                    className="bg-transparent text-xl font-semibold text-center flex-1 outline-none disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$1</span>
                  <span>Max: ${formatPrice(balance)}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <Button
                onClick={() => handleTrade("higher")}
                disabled={executeTradeMutation.isPending || !!activeTrade}
                data-testid="button-higher"
                className="w-full h-16 bg-success hover:bg-success/90 text-white text-lg font-bold flex items-center justify-center gap-3"
              >
                <ArrowUp className="w-6 h-6" />
                HIGHER
              </Button>

              <Button
                onClick={() => handleTrade("lower")}
                disabled={executeTradeMutation.isPending || !!activeTrade}
                data-testid="button-lower"
                className="w-full h-16 bg-destructive hover:bg-destructive/90 text-white text-lg font-bold flex items-center justify-center gap-3"
              >
                <ArrowDown className="w-6 h-6" />
                LOWER
              </Button>
            </div>

            <AssetInfoPanel asset={selectedAsset} className="mt-4" />
          </div>
        </div>

        {/* Mobile Trading Panel - Fixed at bottom */}
        <div className="md:hidden border-t border-white/10 glass-dark p-3 space-y-3">
          {/* Active Trade Mobile View */}
          {activeTrade && (
            <div className={cn(
              "glass-light rounded-lg p-3 border-2 text-center",
              activeTrade.direction === "higher" ? "border-success" : "border-destructive"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {activeTrade.direction.toUpperCase()} - ${activeTrade.amount}
                </span>
                <span className={cn(
                  "text-2xl font-bold font-mono",
                  activeTrade.direction === "higher" ? "text-success" : "text-destructive"
                )} data-testid="text-countdown-mobile">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDoubleUp}
                  data-testid="button-double-up-mobile"
                  className="flex-1 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Double Up
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSellEarly}
                  data-testid="button-sell-early-mobile"
                  className="flex-1 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Sell Early
                </Button>
              </div>
            </div>
          )}

          {/* Time and Amount Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Time Selector */}
            <div>
              <div className="text-xs text-muted-foreground text-center mb-1">Time</div>
              <Select value={expiration} onValueChange={setExpiration} disabled={!!activeTrade}>
                <SelectTrigger className="glass-light border-0 h-12" data-testid="select-expiration-mobile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10 max-h-[200px]">
                  {expiryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div>
              <div className="text-xs text-muted-foreground text-center mb-1">Amount ($)</div>
              <div className="glass-light rounded-lg flex items-center justify-between h-12 px-3">
                <button 
                  onClick={() => setAmount(Math.max(1, amount - 10))}
                  data-testid="button-amount-minus"
                  className="text-muted-foreground"
                  disabled={!!activeTrade}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold" data-testid="text-amount-mobile">{amount}</span>
                <button 
                  onClick={() => setAmount(Math.min(balance, amount + 10))}
                  data-testid="button-amount-plus"
                  className="text-muted-foreground"
                  disabled={!!activeTrade}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Amount Slider Mobile */}
          <div className="px-1">
            <Slider
              value={[amount]}
              onValueChange={handleSliderChange}
              min={1}
              max={Math.max(1, balance)}
              step={1}
              disabled={!!activeTrade}
              data-testid="slider-amount-mobile"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$1</span>
              <span>Max: ${formatPrice(balance)}</span>
            </div>
          </div>

          {/* Lower/Higher Buttons Row */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleTrade("lower")}
              disabled={executeTradeMutation.isPending || !!activeTrade}
              data-testid="button-lower-mobile"
              className="h-14 bg-destructive hover:bg-destructive/90 text-white text-lg font-bold flex items-center justify-center gap-2"
            >
              Lower
              <TrendingDown className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => handleTrade("higher")}
              disabled={executeTradeMutation.isPending || !!activeTrade}
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
          {sidebarItems.slice(0, 5).map((item) => (
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

      {/* Trade Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="glass-dark border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {tradeResult?.isWin ? "Trade Won!" : "Trade Lost"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className={cn(
              "text-6xl font-bold mb-4",
              tradeResult?.isWin ? "text-success" : "text-destructive"
            )} data-testid="text-trade-result">
              {tradeResult?.isWin ? "+" : ""}{tradeResult?.profit.toFixed(2)}$
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Direction:</span>
                <span className={tradeResult?.direction === "higher" ? "text-success" : "text-destructive"}>
                  {tradeResult?.direction?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entry Price:</span>
                <span>{tradeResult?.entryPrice ? formatPrice(tradeResult.entryPrice) : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Exit Price:</span>
                <span>{tradeResult?.exitPrice ? formatPrice(tradeResult.exitPrice) : "-"}</span>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              onClick={() => setShowResultDialog(false)}
              data-testid="button-close-result"
            >
              Continue Trading
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
