import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Wallet, History, BarChart3, MessageCircle, Trophy, 
  Settings, Plus, ArrowUp, ArrowDown, Clock, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CandlestickChart } from "@/components/candlestick-chart";
import { MarketModal } from "@/components/market-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Asset, allAssets, cryptoAssets, formatPrice } from "@/lib/market-data";
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
  { id: "portfolio", icon: Wallet, label: "Total Portfolio" },
  { id: "history", icon: History, label: "Trading History" },
  { id: "dashboard", icon: BarChart3, label: "Performance Dashboard" },
  { id: "chat", icon: MessageCircle, label: "Chats & Support" },
  { id: "leaderboard", icon: Trophy, label: "Leader Board" },
  { id: "more", icon: Settings, label: "More" },
];

export default function TradeRoom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [openAssets, setOpenAssets] = useState<Asset[]>([cryptoAssets[0]]);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(cryptoAssets[0]);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [expiration, setExpiration] = useState<TimeFrame>("30s");
  const [amount, setAmount] = useState("1");
  const [activeSidebar, setActiveSidebar] = useState("portfolio");

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const balance = parseFloat(dashboardData?.portfolio?.balance || "10000");
  const totalProfit = parseFloat(dashboardData?.portfolio?.totalProfit || "0");
  const totalProfitPercent = parseFloat(dashboardData?.portfolio?.totalProfitPercent || "0");

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

  const profitPercent = 87;
  const potentialProfit = (parseFloat(amount) * (profitPercent / 100)).toFixed(2);

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      <aside className="w-16 border-r border-white/10 flex flex-col items-center py-4 glass-dark">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#FF5722] flex items-center justify-center mb-6">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>

        <nav className="flex-1 flex flex-col items-center gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebar(item.id)}
              data-testid={`sidebar-${item.id}`}
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200",
                activeSidebar === item.id
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

      {activeSidebar === "portfolio" && (
        <div className="w-48 border-r border-white/10 p-3 glass-dark">
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">HIGHER</div>
            <div className="text-xl font-bold text-success">24%</div>
          </div>
          <div className="h-32 glass-light rounded-lg mb-4" />
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">LOWER</div>
            <div className="text-xl font-bold text-muted-foreground">76%</div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="flex items-center gap-2 px-2 h-14 border-b border-white/10">
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

        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
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

            <div className="flex-1 relative p-2">
              <CandlestickChart
                symbol={selectedAsset.symbol}
                currentPrice={selectedAsset.price}
                isPositive={selectedAsset.changePercent24h >= 0}
              />

              <div className="absolute bottom-4 right-4 glass-dark rounded-lg px-3 py-2 text-right">
                <div className="text-2xl font-mono font-bold">
                  {formatPrice(selectedAsset.price)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-t border-white/10">
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

          <div className="w-64 border-l border-white/10 flex flex-col p-4 glass-dark">
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
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                  className="bg-transparent border-0 text-xl font-semibold text-center p-0 h-auto focus-visible:ring-0"
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
      </div>

      <MarketModal
        open={marketModalOpen}
        onOpenChange={setMarketModalOpen}
        onSelectAsset={handleSelectAsset}
      />
    </div>
  );
}
