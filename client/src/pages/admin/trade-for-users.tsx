import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Check, ChevronRight, ChevronLeft, ArrowUp, ArrowDown,
  Clock, Plus, X, DollarSign, TrendingUp, TrendingDown, History,
  ChevronDown, Activity, Minus, Copy, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandlestickChart, type IndicatorSettings } from "@/components/candlestick-chart";
import { MarketModal } from "@/components/market-modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { allAssets, cryptoAssets, type Asset, formatPrice } from "@/lib/market-data";
import { format } from "date-fns";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  balance: string;
  vipLevel: string | null;
}

interface SelectedUser extends User {
  tradeAmount: number;
}

interface AdminTrade {
  id: string;
  sessionId: string;
  userId: string;
  symbol: string;
  name: string;
  assetType: string;
  direction: string;
  amount: string;
  entryPrice: string;
  exitPrice: string | null;
  profit: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
  user?: User;
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
];

const getSymbolInitials = (symbol: string): string => {
  if (symbol.includes("/")) {
    const parts = symbol.split("/");
    return parts[0].slice(0, 2);
  }
  return symbol.slice(0, 2);
};

type PageView = "history" | "select-users" | "trade-room";

export default function TradeForUsers() {
  const [currentPage, setCurrentPage] = useState<PageView>("history");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const { toast } = useToast();

  // User selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [defaultAmount, setDefaultAmount] = useState(100);

  // Trade room state - restore sessionId from localStorage on mount
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_trade_session_id');
    }
    return null;
  });
  const [openAssets, setOpenAssets] = useState<Asset[]>([cryptoAssets[0]]);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(cryptoAssets[0]);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [expiration, setExpiration] = useState("1m");
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    alligator: false,
    movingAverage: false,
    ema: false,
    maPeriod: 20,
    emaPeriod: 12,
  });

  // Profit dialog
  const [profitDialogOpen, setProfitDialogOpen] = useState(false);
  const [profitAmounts, setProfitAmounts] = useState<Record<string, number>>({});

  // Fetch users with balance
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users-with-balance"],
  });

  // Fetch trade history
  const { data: tradeHistory = [], isLoading: historyLoading } = useQuery<AdminTrade[]>({
    queryKey: ["/api/admin/trades-history"],
  });

  // Persist sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('admin_trade_session_id', sessionId);
    } else {
      localStorage.removeItem('admin_trade_session_id');
    }
  }, [sessionId]);

  // Fetch session data if sessionId exists but selectedUsers is empty (page refresh scenario)
  const { data: sessionData, isLoading: sessionLoading, isError: sessionError, isFetched: sessionFetched } = useQuery<{
    id: string;
    users: { userId: string; tradeAmount: string; user?: User }[];
    status: string;
  }>({
    queryKey: ["/api/admin/trade-sessions", sessionId],
    enabled: !!sessionId && selectedUsers.length === 0,
    retry: false, // Don't retry on error - stale session should be cleared
  });

  // Clear stale sessionId from localStorage if session fetch fails or is not found
  // Only clear if query was actually enabled and fetched (selectedUsers.length === 0)
  useEffect(() => {
    if (sessionId && selectedUsers.length === 0 && sessionFetched && !sessionLoading) {
      if (sessionError || !sessionData) {
        localStorage.removeItem('admin_trade_session_id');
        setSessionId(null);
        setCurrentPage("history");
      }
    }
  }, [sessionError, sessionId, sessionLoading, sessionData, sessionFetched, selectedUsers.length]);

  // Load session users when session data is fetched and navigate to trade room if session is active
  useEffect(() => {
    if (sessionData && sessionData.users && sessionData.users.length > 0 && selectedUsers.length === 0) {
      const loadedUsers: SelectedUser[] = sessionData.users.map((su) => ({
        id: su.userId,
        firstName: su.user?.firstName || null,
        lastName: su.user?.lastName || null,
        email: su.user?.email || null,
        balance: su.user?.balance || "0",
        vipLevel: su.user?.vipLevel || null,
        tradeAmount: parseFloat(su.tradeAmount) || 100,
      }));
      setSelectedUsers(loadedUsers);
      // Navigate to trade room if session is active
      if (sessionData.status === "active" && currentPage === "history") {
        setCurrentPage("trade-room");
      }
    }
  }, [sessionData, selectedUsers.length, currentPage]);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (users: { userId: string; tradeAmount: string }[]) => {
      const res = await apiRequest("POST", "/api/admin/trade-sessions", { users });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      // Update selected users with data from server to ensure consistency
      if (data.users && data.users.length > 0) {
        const updatedUsers: SelectedUser[] = data.users.map((su: any) => ({
          id: su.userId,
          firstName: su.user?.firstName || null,
          lastName: su.user?.lastName || null,
          email: su.user?.email || null,
          balance: su.user?.balance || "0",
          vipLevel: su.user?.vipLevel || null,
          tradeAmount: parseFloat(su.tradeAmount) || 100,
        }));
        setSelectedUsers(updatedUsers);
      }
      navigateTo("trade-room");
      toast({ title: "Session Created", description: "You can now trade for the selected users" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create session", variant: "destructive" });
    },
  });

  // Execute trade mutation
  const executeTradeMutation = useMutation({
    mutationFn: async (data: {
      symbol: string;
      name: string;
      assetType: string;
      direction: "higher" | "lower";
      entryPrice: number;
      expiryMs: number;
    }) => {
      if (!sessionId) throw new Error("No active session");
      return apiRequest("POST", `/api/admin/trade-sessions/${sessionId}/trade`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });
      toast({ title: "Trade Executed", description: `Trade placed for ${selectedUsers.length} user(s)` });
    },
    onError: (error: any) => {
      toast({ title: "Trade Failed", description: error?.message || "Failed to execute trade", variant: "destructive" });
    },
  });

  // Add profit mutation
  const addProfitMutation = useMutation({
    mutationFn: async (profitAmounts: { userId: string; amount: number }[]) => {
      if (!sessionId) throw new Error("No active session");
      return apiRequest("POST", `/api/admin/trade-sessions/${sessionId}/add-profit`, { profitAmounts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-balance"] });
      toast({ title: "Profit Added", description: "User balances updated successfully" });
      setProfitDialogOpen(false);
      setProfitAmounts({});
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to add profit", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(user => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const getUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "Unknown";
  };

  const getInitials = (user: User) => {
    const name = getUserName(user);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleUserSelection = (user: User) => {
    const existing = selectedUsers.find(u => u.id === user.id);
    if (existing) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, { ...user, tradeAmount: defaultAmount }]);
    }
  };

  const updateUserAmount = (userId: string, amount: number) => {
    setSelectedUsers(selectedUsers.map(u => 
      u.id === userId ? { ...u, tradeAmount: amount } : u
    ));
  };

  const applyDefaultAmountToAll = () => {
    setSelectedUsers(selectedUsers.map(u => ({ ...u, tradeAmount: defaultAmount })));
  };

  const navigateTo = (page: PageView) => {
    if (page === "history" || (page === "select-users" && currentPage === "trade-room")) {
      setSlideDirection("right");
    } else {
      setSlideDirection("left");
    }
    setCurrentPage(page);
  };

  const handleStartNewTrade = () => {
    setSelectedUsers([]);
    setSessionId(null);
    localStorage.removeItem('admin_trade_session_id');
    navigateTo("select-users");
  };

  const handleProceedToTrading = () => {
    if (selectedUsers.length === 0) {
      toast({ title: "No Users Selected", description: "Please select at least one user", variant: "destructive" });
      return;
    }
    createSessionMutation.mutate(
      selectedUsers.map(u => ({ userId: u.id, tradeAmount: u.tradeAmount.toFixed(2) }))
    );
  };

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
    
    const expiryMs = getExpiryMs();
    const now = Date.now();
    
    const newTrade: ActiveTrade = {
      id: `trade-${now}`,
      symbol: selectedAsset.symbol,
      direction,
      amount: selectedUsers.reduce((sum, u) => sum + u.tradeAmount, 0),
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
      direction,
      entryPrice: selectedAsset.price,
      expiryMs,
    });
  };

  useEffect(() => {
    if (!activeTrade) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeTrade.expiryTime - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setActiveTrade(null);
        toast({ title: "Trade Completed", description: "The trade period has ended" });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTrade]);

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

  const handleOpenProfitDialog = () => {
    const amounts: Record<string, number> = {};
    selectedUsers.forEach(u => { amounts[u.id] = 0; });
    setProfitAmounts(amounts);
    setProfitDialogOpen(true);
  };

  const handleAddProfit = () => {
    const profitList = Object.entries(profitAmounts)
      .filter(([_, amount]) => amount !== 0)
      .map(([userId, amount]) => ({ userId, amount }));
    
    if (profitList.length === 0) {
      toast({ title: "No Changes", description: "Enter profit amounts first", variant: "destructive" });
      return;
    }
    
    addProfitMutation.mutate(profitList);
  };

  // Group trades by date
  const groupedTrades = tradeHistory.reduce((acc, trade) => {
    const date = format(new Date(trade.createdAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, AdminTrade[]>);

  const activeTrades = tradeHistory.filter(t => t.status === "active" || t.status === "pending");
  const completedTrades = tradeHistory.filter(t => t.status === "completed" || t.status === "closed");

  const slideVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "left" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "left" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <AnimatePresence mode="wait" custom={slideDirection}>
        {/* Page 3: Trade History (Default) */}
        {currentPage === "history" && (
          <motion.div
            key="history"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Trade for Users</h2>
                  <p className="text-sm text-muted-foreground">View trade history and start new sessions</p>
                </div>
                <Button 
                  onClick={handleStartNewTrade}
                  className="bg-primary"
                  data-testid="button-new-trade"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Trade
                </Button>
              </div>

              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active" data-testid="tab-active-trades">
                    Active Trades ({activeTrades.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="tab-completed-trades">
                    Completed ({completedTrades.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4 mt-4">
                  {historyLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : activeTrades.length === 0 ? (
                    <Card className="glass-card p-8 text-center">
                      <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No active trades</p>
                      <Button onClick={handleStartNewTrade} className="mt-4" data-testid="button-start-trading">
                        Start Trading
                      </Button>
                    </Card>
                  ) : (
                    Object.entries(groupedTrades).map(([date, trades]) => {
                      const activeInDate = trades.filter(t => t.status === "active" || t.status === "pending");
                      if (activeInDate.length === 0) return null;
                      return (
                        <div key={date} className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            {format(new Date(date), "MMMM d, yyyy")}
                          </h3>
                          {activeInDate.map((trade) => (
                            <Card key={trade.id} className="glass-card p-4" data-testid={`trade-card-${trade.id}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    trade.direction === "higher" ? "bg-success/20" : "bg-destructive/20"
                                  )}>
                                    {trade.direction === "higher" ? 
                                      <TrendingUp className="w-5 h-5 text-success" /> : 
                                      <TrendingDown className="w-5 h-5 text-destructive" />
                                    }
                                  </div>
                                  <div>
                                    <div className="font-medium">{trade.symbol}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {trade.user ? getUserName(trade.user) : "Unknown User"}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">${parseFloat(trade.amount).toLocaleString()}</div>
                                  <Badge className={cn(
                                    "text-xs",
                                    trade.status === "active" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                                  )}>
                                    {trade.status}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4 mt-4">
                  {completedTrades.length === 0 ? (
                    <Card className="glass-card p-8 text-center">
                      <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No completed trades yet</p>
                    </Card>
                  ) : (
                    Object.entries(groupedTrades).map(([date, trades]) => {
                      const completedInDate = trades.filter(t => t.status === "completed" || t.status === "closed");
                      if (completedInDate.length === 0) return null;
                      return (
                        <div key={date} className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            {format(new Date(date), "MMMM d, yyyy")}
                          </h3>
                          {completedInDate.map((trade) => (
                            <Card key={trade.id} className="glass-card p-4" data-testid={`trade-card-${trade.id}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    trade.direction === "higher" ? "bg-success/20" : "bg-destructive/20"
                                  )}>
                                    {trade.direction === "higher" ? 
                                      <TrendingUp className="w-5 h-5 text-success" /> : 
                                      <TrendingDown className="w-5 h-5 text-destructive" />
                                    }
                                  </div>
                                  <div>
                                    <div className="font-medium">{trade.symbol}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {trade.user ? getUserName(trade.user) : "Unknown User"}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">${parseFloat(trade.amount).toLocaleString()}</div>
                                  {trade.profit && (
                                    <span className={cn(
                                      "text-sm font-medium",
                                      parseFloat(trade.profit) >= 0 ? "text-success" : "text-destructive"
                                    )}>
                                      {parseFloat(trade.profit) >= 0 ? "+" : ""}{parseFloat(trade.profit).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      );
                    })
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}

        {/* Page 1: User Selection */}
        {currentPage === "select-users" && (
          <motion.div
            key="select-users"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="flex flex-col min-h-[calc(100vh-200px)]"
          >
            <div className="flex flex-col flex-1 gap-4 sm:gap-6">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigateTo("history")}
                  data-testid="button-back-to-history"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Select Users</h2>
                  <p className="text-sm text-muted-foreground">Choose users to trade for</p>
                </div>
              </div>

              <Card className="glass-card p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground mb-1 block">Default Amount</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={defaultAmount}
                        onChange={(e) => setDefaultAmount(parseFloat(e.target.value) || 0)}
                        className="w-32"
                        data-testid="input-default-amount"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={applyDefaultAmountToAll}
                        disabled={selectedUsers.length === 0}
                        data-testid="button-apply-to-all"
                      >
                        Apply to All
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Selected</Label>
                    <Badge className="bg-primary/20 text-primary text-lg px-3 py-1">
                      {selectedUsers.length} users
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No users with balance found</p>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);
                      const selectedUser = selectedUsers.find(u => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all",
                            isSelected
                              ? "bg-primary/20 border border-primary/50"
                              : "glass-light hover-elevate"
                          )}
                        >
                          <button
                            onClick={() => toggleUserSelection(user)}
                            className="flex items-center gap-3 flex-1 text-left"
                            data-testid={`button-select-user-${user.id}`}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-md border-2 flex items-center justify-center",
                              isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                            )}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{getUserName(user)}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-medium text-sm">${parseFloat(user.balance).toLocaleString()}</div>
                              <Badge className="text-xs bg-primary/10 text-primary">{user.vipLevel || "Bronze"}</Badge>
                            </div>
                          </button>
                          {isSelected && selectedUser && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={selectedUser.tradeAmount}
                                onChange={(e) => updateUserAmount(user.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-sm"
                                data-testid={`input-amount-${user.id}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={handleProceedToTrading}
                  disabled={selectedUsers.length === 0 || createSessionMutation.isPending}
                  className="min-w-32"
                  data-testid="button-proceed"
                >
                  {createSessionMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Page 2: Trade Room */}
        {currentPage === "trade-room" && (
          <motion.div
            key="trade-room"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="flex flex-col min-h-[calc(100vh-200px)]"
          >
            {/* Trade Room Header */}
            <header className="flex items-center gap-2 px-2 h-14 border-b border-white/10 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigateTo("select-users")}
                data-testid="button-back-to-users"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-1 overflow-x-auto flex-1">
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
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUsersPanel(!showUsersPanel)}
                data-testid="button-toggle-users"
              >
                <Users className="w-4 h-4 mr-2" />
                {selectedUsers.length} Users
              </Button>

              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={handleOpenProfitDialog}
                data-testid="button-add-profit"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Add Profit
              </Button>
            </header>

            {/* Main Trade Area */}
            <div className="flex-1 flex min-h-0">
              {/* Chart Section */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Asset Info */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
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

                  <div className="ml-auto flex items-center gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          data-testid="button-indicators"
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                            (indicators.alligator || indicators.movingAverage || indicators.ema)
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover-elevate"
                          )}
                        >
                          <Activity className="w-5 h-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 glass-dark border-white/10 p-4">
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
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Chart */}
                <div className="flex-1 p-2 min-h-0">
                  <CandlestickChart 
                    symbol={selectedAsset.symbol}
                    currentPrice={selectedAsset.price}
                    isPositive={selectedAsset.change24h >= 0}
                    indicators={indicators}
                  />
                </div>
              </div>

              {/* Users Panel (Collapsible) */}
              <AnimatePresence>
                {showUsersPanel && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-l border-white/10 overflow-hidden"
                  >
                    <div className="p-4 h-full overflow-auto">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Trading For
                      </h3>
                      <div className="space-y-2">
                        {selectedUsers.map((user) => (
                          <div key={user.id} className="glass-light p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(user)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{getUserName(user)}</div>
                                <div className="text-xs text-muted-foreground">${user.tradeAmount}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trading Panel */}
              <div className="w-72 border-l border-white/10 p-4 flex flex-col gap-4">
                <div className="glass-light rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Total Trading</div>
                  <div className="text-2xl font-bold">
                    ${selectedUsers.reduce((sum, u) => sum + u.tradeAmount, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    for {selectedUsers.length} user(s)
                  </div>
                </div>

                <div className="glass-light rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-2">Expiry Time</div>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger data-testid="select-expiry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expiryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeTrade ? (
                  <div className="glass-light rounded-xl p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {formatCountdown(countdown)}
                    </div>
                    <Badge className={cn(
                      "text-sm",
                      activeTrade.direction === "higher" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {activeTrade.direction.toUpperCase()}
                    </Badge>
                  </div>
                ) : (
                  <>
                    <Button
                      className="bg-success hover:bg-success/90 h-14 text-lg font-bold"
                      onClick={() => handleTrade("higher")}
                      disabled={executeTradeMutation.isPending}
                      data-testid="button-higher"
                    >
                      <ArrowUp className="w-5 h-5 mr-2" />
                      HIGHER
                    </Button>
                    <Button
                      className="bg-destructive hover:bg-destructive/90 h-14 text-lg font-bold"
                      onClick={() => handleTrade("lower")}
                      disabled={executeTradeMutation.isPending}
                      data-testid="button-lower"
                    >
                      <ArrowDown className="w-5 h-5 mr-2" />
                      LOWER
                    </Button>
                  </>
                )}

                <div className="glass-light rounded-lg p-2 mt-auto">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Users</div>
                      <div className="text-xs font-semibold">{selectedUsers.length}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Total</div>
                      <div className="text-xs font-semibold text-warning">
                        ${selectedUsers.reduce((sum, u) => sum + u.tradeAmount, 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Payout</div>
                      <div className="text-xs font-semibold text-success">87%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Modal */}
      <MarketModal
        open={marketModalOpen}
        onOpenChange={setMarketModalOpen}
        onSelectAsset={handleSelectAsset}
      />

      {/* Add Profit Dialog */}
      <Dialog open={profitDialogOpen} onOpenChange={setProfitDialogOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Add Profit to Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">{getUserName(user)}</div>
                  <div className="text-xs text-muted-foreground">Balance: ${parseFloat(user.balance).toLocaleString()}</div>
                </div>
                <Input
                  type="number"
                  value={profitAmounts[user.id] || 0}
                  onChange={(e) => setProfitAmounts(prev => ({
                    ...prev,
                    [user.id]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-28"
                  placeholder="Profit"
                  data-testid={`input-profit-${user.id}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProfitDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddProfit}
              disabled={addProfitMutation.isPending}
              className="bg-success hover:bg-success/90"
              data-testid="button-confirm-profit"
            >
              {addProfitMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Add Profit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
