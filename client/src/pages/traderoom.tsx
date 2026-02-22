import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Wallet, History, BarChart3, MessageCircle, Newspaper, 
  Settings, Plus, Clock, ChevronDown,
  ChevronLeft, ChevronRight, Minus,
  Copy, X, Crown, Activity, CandlestickChart as CandlestickIcon, LineChart, AreaChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CandlestickChart, type IndicatorSettings, type ChartType } from "@/components/candlestick-chart";
import { MarketModal } from "@/components/market-modal";
import { AssetInfoPanel } from "@/components/asset-info-panel";
import { useAuth } from "@/hooks/use-auth";
import { useTradeNotification, TradeNotificationContainer } from "@/components/trade-notification";
import Lottie from "lottie-react";
import confettiAnimation from "@/assets/confetti.json";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Asset, formatPrice } from "@/lib/market-data";
import { useMarketData } from "@/hooks/use-market-data";
import { cn } from "@/lib/utils";
import type { UserPosition } from "@shared/schema";

interface DashboardData {
  portfolio: {
    id: string;
    balance: string;
    totalProfit: string;
    totalProfitPercent: string;
  };
}

const sidebarItems = [
  { id: "trade", icon: BarChart3, label: "Trade", route: "/" },
  { id: "portfolio", icon: Wallet, label: "Portfolio", route: "/portfolio" },
  { id: "history", icon: History, label: "History", route: "/history" },
  { id: "chat", icon: MessageCircle, label: "Support", route: "/support" },
  { id: "news", icon: Newspaper, label: "News", route: "/news" },
  { id: "vip", icon: Crown, label: "VIP", route: "/vip" },
  { id: "more", icon: Settings, label: "More", route: "/more" },
];

const getSymbolInitials = (symbol: string): string => {
  if (symbol.includes("/")) {
    const parts = symbol.split("/");
    return parts[0].slice(0, 2);
  }
  return symbol.slice(0, 2);
};

export default function TradeRoom() {
  const { user } = useAuth();
  const notify = useTradeNotification();
  const [, setLocation] = useLocation();
  
  const { cryptoAssets, forexAssets, stockAssets, etfAssets, allAssets, getAssetBySymbol } = useMarketData({ refreshInterval: 5000 });
  
  const [openAssets, setOpenAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [volume, setVolume] = useState<number>(0);
  const [volumeManuallyEdited, setVolumeManuallyEdited] = useState(false);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [triggerPrice, setTriggerPrice] = useState<string>("");
  const [executionType, setExecutionType] = useState("market");
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    alligator: false,
    movingAverage: false,
    ema: false,
    maPeriod: 20,
    emaPeriod: 12,
  });
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (cryptoAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(cryptoAssets[0]);
      setOpenAssets([cryptoAssets[0]]);
    }
  }, [cryptoAssets, selectedAsset]);

  useEffect(() => {
    if (selectedAsset && allAssets.length > 0) {
      const updatedAsset = allAssets.find(a => a.symbol === selectedAsset.symbol);
      if (updatedAsset && updatedAsset.price !== selectedAsset.price) {
        setSelectedAsset(updatedAsset);
        setOpenAssets(prev => prev.map(a => 
          a.symbol === updatedAsset.symbol ? updatedAsset : a
        ));
      }
    }
  }, [allAssets, selectedAsset]);

  useEffect(() => {
    setVolumeManuallyEdited(false);
  }, [selectedAsset?.symbol]);

  useEffect(() => {
    if (!volumeManuallyEdited && selectedAsset && selectedAsset.price > 0) {
      setVolume(parseFloat((amount / selectedAsset.price).toFixed(8)));
    }
  }, [selectedAsset?.symbol, selectedAsset?.price, amount, volumeManuallyEdited]);

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const { data: openPositions = [] } = useQuery<UserPosition[]>({
    queryKey: ["/api/positions", "open"],
    queryFn: async () => {
      const res = await fetch("/api/positions?status=open");
      return res.json();
    },
    refetchInterval: 2000,
  });

  const { data: pendingPositions = [] } = useQuery<UserPosition[]>({
    queryKey: ["/api/positions", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/positions?status=pending");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const balance = parseFloat(dashboardData?.portfolio?.balance || "10000");

  const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl || "0"), 0);
  const totalOrdersMargin = openPositions.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const equity = balance + totalUnrealizedPnl;
  const accountMargin = equity - totalOrdersMargin;

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource("/api/user/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "portfolio_update") {
          queryClient.setQueryData<DashboardData>(["/api/dashboard"], (old) => {
            if (!old) return old;
            return {
              ...old,
              portfolio: {
                ...old.portfolio,
                balance: data.balance,
                totalProfit: data.totalProfit,
                totalProfitPercent: data.totalProfitPercent,
              },
            };
          });
        }
        if (data.type === "position_closed") {
          const pnl = parseFloat(data.realizedPnl);
          notify({
            type: "position_closed",
            title: data.closeReason === "stop_loss" ? "Stop Loss Hit" : data.closeReason === "take_profit" ? "Take Profit Hit" : "Position Closed",
            description: `${data.symbol} ${data.direction.toUpperCase()} closed at ${formatPrice(parseFloat(data.exitPrice))}`,
            pnl,
            direction: data.direction,
          });
          if (pnl > 0) {
            setShowConfetti(true);
          }
          queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        }
        if (data.type === "position_opened") {
          queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        }
      } catch {
      }
    };

    eventSource.onerror = () => {
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const openPositionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/positions/open", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setStopLoss("");
      setTakeProfit("");
      setTriggerPrice("");
      notify({ type: "position_opened", title: "Position Opened", description: "Your trade has been placed successfully." });
    },
    onError: (error: Error) => {
      notify({ type: "error", title: "Trade Failed", description: error.message });
    },
  });

  const closePositionMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const res = await apiRequest("POST", `/api/positions/${positionId}/close`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: Error) => {
      notify({ type: "error", title: "Close Failed", description: error.message });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const res = await apiRequest("POST", `/api/positions/${positionId}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      notify({ type: "info", title: "Order Cancelled" });
    },
    onError: (error: Error) => {
      notify({ type: "error", title: "Cancel Failed", description: error.message });
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
    if (selectedAsset?.symbol === asset.symbol && newAssets.length > 0) {
      setSelectedAsset(newAssets[0]);
    }
  };

  const handleTrade = (direction: "buy" | "sell") => {
    if (!selectedAsset) return;
    
    if (amount <= 0 || amount > balance || !isFinite(amount)) {
      notify({ type: "error", title: "Invalid Amount", description: "Please enter a valid trade amount." });
      return;
    }

    if (selectedAsset.price <= 0) {
      notify({ type: "error", title: "Price Unavailable", description: "Cannot trade while price data is unavailable." });
      return;
    }

    const parsedSL = stopLoss ? parseFloat(stopLoss) : undefined;
    const parsedTP = takeProfit ? parseFloat(takeProfit) : undefined;
    const parsedTrigger = triggerPrice ? parseFloat(triggerPrice) : undefined;

    if (parsedSL !== undefined && parsedSL <= 0) {
      notify({ type: "error", title: "Invalid Stop Loss", description: "Stop loss must be a positive number." });
      return;
    }
    if (parsedTP !== undefined && parsedTP <= 0) {
      notify({ type: "error", title: "Invalid Take Profit", description: "Take profit must be a positive number." });
      return;
    }

    if (executionType !== "market" && !parsedTrigger) {
      notify({ type: "error", title: "Trigger Price Required", description: `Please set a trigger price for ${executionType} orders.` });
      return;
    }

    openPositionMutation.mutate({
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      assetType: selectedAsset.type,
      direction,
      orderType: executionType,
      amount,
      volume: volume > 0 ? volume : parseFloat((amount / selectedAsset.price).toFixed(8)),
      entryPrice: selectedAsset.price,
      triggerPrice: parsedTrigger,
      stopLoss: parsedSL,
      takeProfit: parsedTP,
    });
  };

  const profitPercent = 87;
  const potentialProfit = (amount * (profitPercent / 100)).toFixed(2);

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  const hasActivePositions = openPositions.length > 0;
  const hasPendingOrders = pendingPositions.length > 0;

  if (!selectedAsset) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white/70">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#0a0a0a] overflow-hidden">
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
          
          <Popover>
            <PopoverTrigger asChild>
              <button
                data-testid="sidebar-indicators"
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200",
                  (indicators.alligator || indicators.movingAverage || indicators.ema)
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover-elevate"
                )}
                title="Trading Indicators"
              >
                <Activity className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-64 glass-dark border-white/10 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Trading Indicators</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(to right, #007AFF, #FF3B30, #34C759)" }} />
                    <Label htmlFor="alligator" className="text-sm">Alligator</Label>
                  </div>
                  <Switch
                    id="alligator"
                    checked={indicators.alligator}
                    onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, alligator: checked }))}
                    data-testid="switch-alligator"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF9500]" />
                    <Label htmlFor="ma" className="text-sm">Moving Average</Label>
                  </div>
                  <Switch
                    id="ma"
                    checked={indicators.movingAverage}
                    onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, movingAverage: checked }))}
                    data-testid="switch-ma"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#AF52DE]" />
                    <Label htmlFor="ema" className="text-sm">Exponential MA</Label>
                  </div>
                  <Switch
                    id="ema"
                    checked={indicators.ema}
                    onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, ema: checked }))}
                    data-testid="switch-ema"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
                  {indicators.alligator && (
                    <div className="flex gap-2 mb-1">
                      <span className="text-[#007AFF]">Jaw (13)</span>
                      <span className="text-[#FF3B30]">Teeth (8)</span>
                      <span className="text-[#34C759]">Lips (5)</span>
                    </div>
                  )}
                  {indicators.movingAverage && <div>MA Period: {indicators.maPeriod}</div>}
                  {indicators.ema && <div>EMA Period: {indicators.emaPeriod}</div>}
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
                  {getSymbolInitials(asset.symbol)}
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
              <span className="text-sm text-muted-foreground">Profit:</span>
              <span 
                className={`text-sm font-bold ${parseFloat(dashboardData?.portfolio?.totalProfit || "0") >= 0 ? "text-success" : "text-destructive"}`}
                data-testid="text-profit-desktop"
              >
                {parseFloat(dashboardData?.portfolio?.totalProfit || "0") >= 0 ? "+" : ""}
                ${formatPrice(Math.abs(parseFloat(dashboardData?.portfolio?.totalProfit || "0")))}
              </span>
            </div>
            <div className="glass-light rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="text-sm font-extrabold text-success" data-testid="text-balance-desktop">
                ${formatPrice(balance)}
              </span>
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
                {getSymbolInitials(asset.symbol)}
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
                  {getSymbolInitials(selectedAsset.symbol)}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {selectedAsset.symbol}
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedAsset.type}</div>
                </div>
              </button>
            </div>
            
            {/* Mobile Chart Controls */}
            <div className="md:hidden flex items-center justify-between px-2 py-1 border-b border-white/10">
              {/* Chart Type Toggle */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChartType("candlestick")}
                  data-testid="button-chart-candlestick-mobile"
                  className={cn(
                    chartType === "candlestick" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <CandlestickIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChartType("line")}
                  data-testid="button-chart-line-mobile"
                  className={cn(
                    chartType === "line" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <LineChart className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChartType("area")}
                  data-testid="button-chart-area-mobile"
                  className={cn(
                    chartType === "area" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <AreaChart className="w-4 h-4" />
                </Button>
              </div>

              {/* Indicators Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid="button-indicators-mobile"
                    className={cn(
                      "gap-2",
                      (indicators.alligator || indicators.movingAverage || indicators.ema)
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    Indicators
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 glass-dark border-white/10 p-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Trading Indicators</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(to right, #007AFF, #FF3B30, #34C759)" }} />
                        <Label htmlFor="alligator-mobile" className="text-sm">Alligator</Label>
                      </div>
                      <Switch
                        id="alligator-mobile"
                        checked={indicators.alligator}
                        onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, alligator: checked }))}
                        data-testid="switch-alligator-mobile"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF9500]" />
                        <Label htmlFor="ma-mobile" className="text-sm">Moving Average</Label>
                      </div>
                      <Switch
                        id="ma-mobile"
                        checked={indicators.movingAverage}
                        onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, movingAverage: checked }))}
                        data-testid="switch-ma-mobile"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#AF52DE]" />
                        <Label htmlFor="ema-mobile" className="text-sm">Exponential MA</Label>
                      </div>
                      <Switch
                        id="ema-mobile"
                        checked={indicators.ema}
                        onCheckedChange={(checked) => setIndicators(prev => ({ ...prev, ema: checked }))}
                        data-testid="switch-ema-mobile"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Chart */}
            <div className="flex-1 relative p-2 min-h-[200px]">
              <TradeNotificationContainer />
              {showConfetti && (
                <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center">
                  <Lottie
                    animationData={confettiAnimation}
                    loop={false}
                    autoplay={true}
                    onComplete={() => setShowConfetti(false)}
                    style={{ width: "80%", height: "80%" }}
                  />
                </div>
              )}
              {/* Desktop Chart Type Toggle - positioned in top right of chart */}
              <div className="hidden md:flex absolute top-4 right-4 z-10 items-center gap-1 glass-dark rounded-lg p-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChartType("candlestick")}
                  data-testid="button-chart-candlestick"
                  className={cn(
                    chartType === "candlestick" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <CandlestickIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChartType("line")}
                  data-testid="button-chart-line"
                  className={cn(
                    chartType === "line" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <LineChart className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setChartType("area")}
                  data-testid="button-chart-area"
                  className={cn(
                    chartType === "area" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <AreaChart className="w-4 h-4" />
                </Button>
              </div>

              <CandlestickChart
                symbol={selectedAsset.symbol}
                currentPrice={selectedAsset.price}
                isPositive={selectedAsset.changePercent24h >= 0}
                indicators={indicators}
                chartType={chartType}
              />

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

          {/* Desktop Trading Panel - MetaTrader Style */}
          <div className="hidden md:flex w-80 border-l border-white/10 flex-col glass-dark overflow-y-auto max-h-full">
            {/* Market Execution Header */}
            <div className="p-3 border-b border-white/10">
              <Select value={executionType} onValueChange={setExecutionType}>
                <SelectTrigger className="glass-light border-0 h-10" data-testid="select-execution-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10">
                  <SelectItem value="market">Market Execution</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  <SelectItem value="stop">Stop Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Volume */}
            <div className="px-3 pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Volume</span>
                <span className="text-xs text-muted-foreground">{selectedAsset?.type === "forex" ? "Lots" : selectedAsset?.type === "crypto" ? "Units" : "Shares"}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setVolumeManuallyEdited(true);
                    const step = selectedAsset ? parseFloat((10 / selectedAsset.price).toFixed(8)) : 1;
                    setVolume(Math.max(0, parseFloat((volume - step).toFixed(8))));
                  }}
                  data-testid="button-volume-minus"
                  className="glass-light rounded px-2 py-1.5 text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  value={volume}
                  onChange={(e) => { setVolumeManuallyEdited(true); setVolume(Math.max(0, parseFloat(e.target.value) || 0)); }}
                  data-testid="input-volume"
                  className="glass-light rounded px-2 py-1.5 text-sm text-center flex-1 bg-transparent outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => {
                    setVolumeManuallyEdited(true);
                    const step = selectedAsset ? parseFloat((10 / selectedAsset.price).toFixed(8)) : 1;
                    setVolume(parseFloat((volume + step).toFixed(8)));
                  }}
                  data-testid="button-volume-plus"
                  className="glass-light rounded px-2 py-1.5 text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Trigger Price (for limit/stop orders) */}
            {executionType !== "market" && (
              <div className="px-3 pt-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {executionType === "limit" ? "Limit Price" : "Stop Price"}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const val = parseFloat(triggerPrice) || selectedAsset.price;
                      setTriggerPrice((val - (selectedAsset.price * 0.001)).toFixed(selectedAsset.price < 1 ? 5 : 2));
                    }}
                    data-testid="button-trigger-minus"
                    className="glass-light rounded px-1.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(e.target.value)}
                    placeholder={formatPrice(selectedAsset.price)}
                    data-testid="input-trigger-price"
                    className="glass-light rounded px-1 py-1.5 text-xs text-center flex-1 bg-transparent outline-none min-w-0 placeholder:text-muted-foreground/50"
                  />
                  <button
                    onClick={() => {
                      const val = parseFloat(triggerPrice) || selectedAsset.price;
                      setTriggerPrice((val + (selectedAsset.price * 0.001)).toFixed(selectedAsset.price < 1 ? 5 : 2));
                    }}
                    data-testid="button-trigger-plus"
                    className="glass-light rounded px-1.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Stop Loss & Take Profit */}
            <div className="px-3 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const val = parseFloat(stopLoss) || selectedAsset.price;
                        setStopLoss((val - (selectedAsset.price * 0.001)).toFixed(selectedAsset.price < 1 ? 5 : 2));
                      }}
                      data-testid="button-sl-minus"
                      className="glass-light rounded px-1.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="---"
                      data-testid="input-stop-loss"
                      className="glass-light rounded px-1 py-1.5 text-xs text-center flex-1 bg-transparent outline-none min-w-0 placeholder:text-muted-foreground/50"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(stopLoss) || selectedAsset.price;
                        setStopLoss((val + (selectedAsset.price * 0.001)).toFixed(selectedAsset.price < 1 ? 5 : 2));
                      }}
                      data-testid="button-sl-plus"
                      className="glass-light rounded px-1.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Take Profit</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const val = parseFloat(takeProfit) || selectedAsset.price;
                        setTakeProfit((val - (selectedAsset.price * 0.001)).toFixed(selectedAsset.price < 1 ? 5 : 2));
                      }}
                      data-testid="button-tp-minus"
                      className="glass-light rounded px-1.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      placeholder="---"
                      data-testid="input-take-profit"
                      className="glass-light rounded px-1 py-1.5 text-xs text-center flex-1 bg-transparent outline-none min-w-0 placeholder:text-muted-foreground/50"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(takeProfit) || selectedAsset.price;
                        setTakeProfit((val + (selectedAsset.price * 0.001)).toFixed(selectedAsset.price < 1 ? 5 : 2));
                      }}
                      data-testid="button-tp-plus"
                      className="glass-light rounded px-1.5 py-1.5 text-muted-foreground hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Amount */}
            <div className="px-3 pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Trading Amount</span>
                <span className="text-xs text-muted-foreground">Max: ${formatPrice(balance)}</span>
              </div>
              <div className="space-y-2">
                <div className="glass-light rounded-lg p-2 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.min(balance, Math.max(1, parseFloat(e.target.value) || 1)))}
                   
                    data-testid="input-amount"
                    className="bg-transparent text-lg font-semibold text-center flex-1 outline-none disabled:opacity-50"
                  />
                </div>
                <Slider
                  value={[amount]}
                  onValueChange={handleSliderChange}
                  min={1}
                  max={Math.max(1, balance)}
                  step={1}
                 
                  data-testid="slider-amount"
                />
              </div>
            </div>

            {/* Spread Display */}
            <div className="px-3 pt-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Spread: {(selectedAsset.price * 0.0002).toFixed(selectedAsset.price < 1 ? 6 : 2)}</span>
                <span>Bid: {formatPrice(selectedAsset.price * 0.9999)} | Ask: {formatPrice(selectedAsset.price * 1.0001)}</span>
              </div>
            </div>

            {/* Bid/Ask Prices & Buy/Sell Buttons */}
            <div className="px-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleTrade("sell")}
                  disabled={openPositionMutation.isPending}
                  data-testid="button-sell"
                  className="h-14 bg-destructive hover:bg-destructive/90 text-white font-bold flex flex-col items-center justify-center gap-0.5 rounded-md"
                >
                  <span className="text-lg font-mono">{formatPrice(selectedAsset.price * 0.9999)}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80">
                    {executionType === "market" ? "Sell by Market" : executionType === "limit" ? "Sell Limit" : "Sell Stop"}
                  </span>
                </Button>

                <Button
                  onClick={() => handleTrade("buy")}
                  disabled={openPositionMutation.isPending}
                  data-testid="button-buy"
                  className="h-14 bg-[#2196F3] hover:bg-[#1976D2] text-white font-bold flex flex-col items-center justify-center gap-0.5 rounded-md"
                >
                  <span className="text-lg font-mono">{formatPrice(selectedAsset.price * 1.0001)}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80">
                    {executionType === "market" ? "Buy by Market" : executionType === "limit" ? "Buy Limit" : "Buy Stop"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Open Positions List */}
            {hasActivePositions && (
              <div className="px-3 pt-3">
                <div className="text-xs text-muted-foreground mb-1.5">Open Positions ({openPositions.length})</div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {openPositions.map((pos) => {
                    const pnl = parseFloat(pos.unrealizedPnl || "0");
                    return (
                      <div key={pos.id} className={cn(
                        "glass-light rounded-lg p-2 border",
                        pos.direction === "buy" ? "border-[#2196F3]/30" : "border-destructive/30"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-semibold", pos.direction === "buy" ? "text-[#2196F3]" : "text-destructive")}>
                            {pos.direction.toUpperCase()} {pos.symbol}
                          </span>
                          <span className={cn("text-xs font-bold", pnl >= 0 ? "text-success" : "text-destructive")} data-testid={`text-pnl-${pos.id}`}>
                            {pnl >= 0 ? "+" : ""}${formatPrice(Math.abs(pnl))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-muted-foreground">${pos.amount} @ {formatPrice(parseFloat(pos.entryPrice))}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => closePositionMutation.mutate(pos.id)}
                            disabled={closePositionMutation.isPending}
                            data-testid={`button-close-position-${pos.id}`}
                            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Orders List */}
            {hasPendingOrders && (
              <div className="px-3 pt-2">
                <div className="text-xs text-muted-foreground mb-1.5">Pending Orders ({pendingPositions.length})</div>
                <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                  {pendingPositions.map((pos) => (
                    <div key={pos.id} className="glass-light rounded-lg p-2 border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-yellow-400">
                          {pos.orderType.toUpperCase()} {pos.direction.toUpperCase()} {pos.symbol}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelOrderMutation.mutate(pos.id)}
                          disabled={cancelOrderMutation.isPending}
                          data-testid={`button-cancel-order-${pos.id}`}
                          className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        ${pos.amount} | Trigger: {formatPrice(parseFloat(pos.triggerPrice || "0"))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account Margin Section */}
            <div className="px-3 pt-3 mt-auto">
              <div className="glass-light rounded-lg p-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Equity</span>
                    <span className={cn("text-sm font-semibold", totalUnrealizedPnl >= 0 ? "text-success" : "text-destructive")} data-testid="text-equity">
                      ${formatPrice(equity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Orders Margin</span>
                    <span className="text-sm font-semibold text-warning" data-testid="text-orders-margin">
                      ${formatPrice(totalOrdersMargin)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Unrealized P&L</span>
                    <span className={cn("text-sm font-semibold", totalUnrealizedPnl >= 0 ? "text-success" : "text-destructive")} data-testid="text-unrealized-pnl">
                      {totalUnrealizedPnl >= 0 ? "+" : ""}${formatPrice(Math.abs(totalUnrealizedPnl))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Account Margin</span>
                    <span className="text-sm font-semibold text-success" data-testid="text-account-margin">
                      ${formatPrice(accountMargin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 pt-3 pb-3">
              <AssetInfoPanel 
                asset={selectedAsset} 
                profitPercent={profitPercent}
                potentialProfit={potentialProfit}
              />
            </div>
          </div>
        </div>

        {/* Mobile Trading Panel - Fixed at bottom */}
        <div className="md:hidden border-t border-white/10 glass-dark p-3 space-y-3">
          {/* Open Positions Mobile View */}
          {hasActivePositions && (
            <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
              {openPositions.slice(0, 2).map((pos) => {
                const pnl = parseFloat(pos.unrealizedPnl || "0");
                return (
                  <div key={pos.id} className={cn(
                    "glass-light rounded-lg p-2 border",
                    pos.direction === "buy" ? "border-[#2196F3]/30" : "border-destructive/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-semibold", pos.direction === "buy" ? "text-[#2196F3]" : "text-destructive")}>
                        {pos.direction.toUpperCase()} {pos.symbol} - ${pos.amount}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", pnl >= 0 ? "text-success" : "text-destructive")}>
                          {pnl >= 0 ? "+" : ""}${formatPrice(Math.abs(pnl))}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => closePositionMutation.mutate(pos.id)}
                          data-testid={`button-close-position-mobile-${pos.id}`}
                          className="h-5 px-1 text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {openPositions.length > 2 && (
                <div className="text-[10px] text-center text-muted-foreground">+{openPositions.length - 2} more positions</div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="text-xs text-muted-foreground text-center mb-1">Amount ($)</div>
            <div className="glass-light rounded-lg flex items-center justify-between h-12 px-3">
              <button 
                onClick={() => setAmount(Math.max(1, amount - 10))}
                data-testid="button-amount-minus"
                className="text-muted-foreground"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold" data-testid="text-amount-mobile">{amount}</span>
              <button 
                onClick={() => setAmount(Math.min(balance, amount + 10))}
                data-testid="button-amount-plus"
                className="text-muted-foreground"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SL/TP Row Mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground text-center mb-1">Stop Loss</div>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="---"
                data-testid="input-stop-loss-mobile"
                className="glass-light rounded-lg w-full h-10 px-3 text-sm text-center bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground text-center mb-1">Take Profit</div>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="---"
                data-testid="input-take-profit-mobile"
                className="glass-light rounded-lg w-full h-10 px-3 text-sm text-center bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
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
              data-testid="slider-amount-mobile"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$1</span>
              <span>Max: ${formatPrice(balance)}</span>
            </div>
          </div>

          {/* Sell/Buy Buttons Row - MetaTrader Style */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleTrade("sell")}
              disabled={openPositionMutation.isPending}
              data-testid="button-sell-mobile"
              className="h-14 bg-destructive hover:bg-destructive/90 text-white font-bold flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-base font-mono">{selectedAsset ? formatPrice(selectedAsset.price * 0.9999) : "---"}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-80">Sell by Market</span>
            </Button>

            <Button
              onClick={() => handleTrade("buy")}
              disabled={openPositionMutation.isPending}
              data-testid="button-buy-mobile"
              className="h-14 bg-[#2196F3] hover:bg-[#1976D2] text-white font-bold flex flex-col items-center justify-center gap-0.5"
            >
              <span className="text-base font-mono">{selectedAsset ? formatPrice(selectedAsset.price * 1.0001) : "---"}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-80">Buy by Market</span>
            </Button>
          </div>

          {/* Account Margin Section - Mobile */}
          <div className="glass-light rounded-lg p-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground">Equity</div>
                <div className={cn("text-xs font-semibold", totalUnrealizedPnl >= 0 ? "text-success" : "text-destructive")} data-testid="text-equity-mobile">
                  ${formatPrice(equity)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Orders Margin</div>
                <div className="text-xs font-semibold text-warning" data-testid="text-orders-margin-mobile">
                  ${formatPrice(totalOrdersMargin)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Account Margin</div>
                <div className="text-xs font-semibold text-success" data-testid="text-account-margin-mobile">
                  ${formatPrice(accountMargin)}
                </div>
              </div>
            </div>
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

    </div>
  );
}
