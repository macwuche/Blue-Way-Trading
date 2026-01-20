import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Check, ChevronRight, ChevronLeft, ArrowUp, ArrowDown,
  Clock, Plus, X, DollarSign, TrendingUp, TrendingDown, History,
  ChevronDown, Activity, Minus, Copy, Wallet, User, RotateCcw, Eye, PlayCircle
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
  name: string;
  assetType: string;
  direction: "higher" | "lower";
  amount: number;
  entryPrice: number;
  expiryTime: number;
  startTime: number;
  tradeIds: string[];
  durationGroup: string;
  assets: CompletedAsset[]; // Store individual assets for profit popup
}

// Extended expiry options from 30 seconds to 2 years
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
  { value: "2h", label: "2 hours", ms: 7200000 },
  { value: "4h", label: "4 hours", ms: 14400000 },
  { value: "8h", label: "8 hours", ms: 28800000 },
  { value: "12h", label: "12 hours", ms: 43200000 },
  { value: "1d", label: "1 day", ms: 86400000 },
  { value: "2d", label: "2 days", ms: 172800000 },
  { value: "3d", label: "3 days", ms: 259200000 },
  { value: "1w", label: "1 week", ms: 604800000 },
  { value: "2w", label: "2 weeks", ms: 1209600000 },
  { value: "1mo", label: "1 month", ms: 2592000000 },
  { value: "3mo", label: "3 months", ms: 7776000000 },
  { value: "6mo", label: "6 months", ms: 15552000000 },
  { value: "1y", label: "1 year", ms: 31536000000 },
  { value: "2y", label: "2 years", ms: 63072000000 },
];

// Asset with individual duration for multi-asset trading
interface TradingAsset extends Asset {
  duration: string; // expiry option value like "30s", "1h"
}

// Asset info for displaying in profit popup
interface CompletedAsset {
  symbol: string;
  name: string;
  assetType: string;
}

// Completed duration group awaiting profit
interface CompletedDurationGroup {
  durationGroup: string;
  trades: AdminTrade[];
  assets: CompletedAsset[];
  completedAt: Date;
}

const getSymbolInitials = (symbol: string): string => {
  if (symbol.includes("/")) {
    const parts = symbol.split("/");
    return parts[0].slice(0, 2);
  }
  return symbol.slice(0, 2);
};

// Get color class based on asset type
const getAssetTypeColor = (assetType: string): string => {
  switch (assetType.toLowerCase()) {
    case 'crypto': return 'text-yellow-500 bg-yellow-500/20';
    case 'forex': return 'text-emerald-500 bg-emerald-500/20';
    case 'stocks': return 'text-blue-500 bg-blue-500/20';
    case 'etf': return 'text-purple-500 bg-purple-500/20';
    default: return 'text-primary bg-primary/20';
  }
};

type PageView = "history" | "select-users" | "trade-room" | "add-profits";

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
  // Multi-asset trading with individual durations
  const [tradingAssets, setTradingAssets] = useState<TradingAsset[]>([{ ...cryptoAssets[0], duration: "1m" }]);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const selectedAsset = tradingAssets[selectedAssetIndex] || { ...cryptoAssets[0], duration: "1m" };
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]); // Multiple active trades for multi-asset
  const [countdowns, setCountdowns] = useState<Record<string, number>>({}); // countdown per duration group
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    alligator: false,
    movingAverage: false,
    ema: false,
    maPeriod: 20,
    emaPeriod: 12,
  });

  // Legacy single trade state for backward compatibility
  const activeTrade = activeTrades.length > 0 ? activeTrades[0] : null;
  const countdown = activeTrade ? (countdowns[activeTrade.durationGroup] || 0) : 0;

  // Profit popup state
  const [profitPopupOpen, setProfitPopupOpen] = useState(false);
  const [profitDialogOpen, setProfitDialogOpen] = useState(false); // Legacy dialog for backward compat
  const [completedDurationGroup, setCompletedDurationGroup] = useState<CompletedDurationGroup | null>(null);
  const [profitMode, setProfitMode] = useState<"group" | "singular">("group");
  const [profitAmounts, setProfitAmounts] = useState<Record<string, number>>({});
  const [groupProfitAmount, setGroupProfitAmount] = useState(0);
  const [profitsAlreadyAdded, setProfitsAlreadyAdded] = useState(false); // Track if profits were added for current completion
  const [reopenConfirmDialogOpen, setReopenConfirmDialogOpen] = useState(false); // Dialog when profits already added
  
  // Helper: get openAssets from tradingAssets (for backward compat)
  const openAssets = tradingAssets;
  const expiration = selectedAsset.duration;

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

  // Execute trade mutation (supports multi-asset)
  const executeTradeMutation = useMutation({
    mutationFn: async (data: {
      assets?: { symbol: string; name: string; assetType: string; entryPrice: number; durationMs: number; durationLabel: string }[];
      direction: "higher" | "lower";
      // Legacy single-asset support
      symbol?: string;
      name?: string;
      assetType?: string;
      entryPrice?: number;
      expiryMs?: number;
    }): Promise<{ success: boolean; trades: { id: string; durationGroup?: string }[] }> => {
      if (!sessionId) throw new Error("No active session");
      const res = await apiRequest("POST", `/api/admin/trade-sessions/${sessionId}/trade`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });
      toast({ title: "Trade Executed", description: `Trade placed for ${selectedUsers.length} user(s) across ${tradingAssets.length} asset(s)` });
    },
    onError: (error: any) => {
      toast({ title: "Trade Failed", description: error?.message || "Failed to execute trade", variant: "destructive" });
    },
  });

  // Complete trades mutation (when countdown ends)
  const completeTradeMutation = useMutation({
    mutationFn: async (data: { tradeIds: string[]; exitPrice: number }) => {
      const res = await apiRequest("POST", "/api/admin/trades/complete", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
    },
    onError: (error: any) => {
      console.error("Error completing trades:", error);
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
    if (page === "history" || (page === "select-users" && currentPage === "trade-room") || (page === "trade-room" && currentPage === "add-profits")) {
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

  // Add new asset to trading list with default duration
  const handleSelectAsset = (asset: Asset) => {
    const existing = tradingAssets.find(a => a.symbol === asset.symbol);
    if (!existing) {
      setTradingAssets([...tradingAssets, { ...asset, duration: "1m" }]);
      setSelectedAssetIndex(tradingAssets.length); // Select the new asset
    } else {
      const index = tradingAssets.findIndex(a => a.symbol === asset.symbol);
      setSelectedAssetIndex(index);
    }
    setMarketModalOpen(false);
  };

  // Close an asset tab
  const handleCloseAssetTab = (asset: TradingAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAssets = tradingAssets.filter(a => a.symbol !== asset.symbol);
    setTradingAssets(newAssets);
    if (selectedAsset.symbol === asset.symbol && newAssets.length > 0) {
      setSelectedAssetIndex(0);
    }
  };

  // Update duration for a specific asset
  const updateAssetDuration = (symbol: string, duration: string) => {
    setTradingAssets(tradingAssets.map(a => 
      a.symbol === symbol ? { ...a, duration } : a
    ));
  };

  // Set expiration for current selected asset
  const setExpiration = (value: string) => {
    updateAssetDuration(selectedAsset.symbol, value);
  };

  const getExpiryMs = useCallback((durationValue?: string) => {
    const dur = durationValue || expiration;
    return expiryOptions.find(o => o.value === dur)?.ms || 60000;
  }, [expiration]);

  // Execute trade for ALL selected assets with their individual durations
  const handleTrade = async (direction: "higher" | "lower") => {
    if (activeTrades.length > 0) return; // Already trading
    
    const now = Date.now();
    
    // Group assets by their duration for countdown management
    const durationGroups = new Map<string, TradingAsset[]>();
    tradingAssets.forEach(asset => {
      const group = durationGroups.get(asset.duration) || [];
      group.push(asset);
      durationGroups.set(asset.duration, group);
    });

    // Start countdowns for each duration group
    const initialCountdowns: Record<string, number> = {};
    durationGroups.forEach((_, duration) => {
      const ms = getExpiryMs(duration);
      initialCountdowns[duration] = Math.floor(ms / 1000);
    });
    setCountdowns(initialCountdowns);

    try {
      // Execute multi-asset trade
      const assets = tradingAssets.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.type,
        entryPrice: asset.price,
        durationMs: getExpiryMs(asset.duration),
        durationLabel: asset.duration,
      }));

      const result = await executeTradeMutation.mutateAsync({
        assets,
        direction,
      } as any);
      
      const tradeIds = result.trades?.map((t) => t.id) || [];
      
      // Create active trades for each duration group
      const newActiveTrades: ActiveTrade[] = [];
      durationGroups.forEach((groupAssets, duration) => {
        const expiryMs = getExpiryMs(duration);
        newActiveTrades.push({
          id: `trade-${now}-${duration}`,
          symbol: groupAssets.map(a => a.symbol).join(", "),
          name: groupAssets.map(a => a.name).join(", "),
          assetType: groupAssets[0].type, // Use first asset's type for color coding
          direction,
          amount: selectedUsers.reduce((sum, u) => sum + u.tradeAmount, 0),
          entryPrice: groupAssets[0].price,
          expiryTime: now + expiryMs,
          startTime: now,
          tradeIds: tradeIds.filter((_, i) => {
            // Split tradeIds by duration group (approximation)
            return true; // For now include all
          }),
          durationGroup: duration,
          // Store individual assets for profit popup display
          assets: groupAssets.map(a => ({ symbol: a.symbol, name: a.name, assetType: a.type })),
        });
      });
      
      setActiveTrades(newActiveTrades);
    } catch (error) {
      setCountdowns({});
    }
  };

  // Countdown effect for multiple active trades
  useEffect(() => {
    if (activeTrades.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdowns: Record<string, number> = {};
      const completedGroups: ActiveTrade[] = [];
      const stillActive: ActiveTrade[] = [];

      activeTrades.forEach(trade => {
        const remaining = Math.max(0, Math.floor((trade.expiryTime - now) / 1000));
        newCountdowns[trade.durationGroup] = remaining;

        if (remaining <= 0) {
          completedGroups.push(trade);
        } else {
          stillActive.push(trade);
        }
      });

      setCountdowns(newCountdowns);

      // Handle completed trades
      completedGroups.forEach(trade => {
        if (trade.tradeIds && trade.tradeIds.length > 0) {
          completeTradeMutation.mutate({
            tradeIds: trade.tradeIds,
            exitPrice: selectedAsset.price,
          });
        }
        
        // Show profit popup for completed group
        toast({ 
          title: `Trade Completed (${trade.durationGroup})`, 
          description: "Click to add profit for users" 
        });
        
        // Use assets captured at trade execution time (stored in ActiveTrade)
        // Trigger profit popup for this duration group
        setProfitsAlreadyAdded(false); // Reset flag for new completion
        setProfitPopupOpen(true);
        setCompletedDurationGroup({
          durationGroup: trade.durationGroup,
          trades: [], // Will be fetched from API
          assets: trade.assets, // Use assets captured at trade execution time
          completedAt: new Date(),
        });
      });

      setActiveTrades(stillActive);
    }, 100);

    return () => clearInterval(interval);
  }, [activeTrades, selectedAsset.price, completeTradeMutation]);

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

  // Handle profit from popup dialog (group or singular mode)
  const handlePopupAddProfit = () => {
    let profitList: { userId: string; amount: number }[] = [];
    
    if (profitMode === "group") {
      // Group mode: apply same profit to all users
      if (groupProfitAmount === 0) {
        toast({ title: "No Profit", description: "Enter a profit amount first", variant: "destructive" });
        return;
      }
      profitList = selectedUsers.map(u => ({ userId: u.id, amount: groupProfitAmount }));
    } else {
      // Singular mode: individual profits per user
      profitList = Object.entries(profitAmounts)
        .filter(([_, amount]) => amount !== 0)
        .map(([userId, amount]) => ({ userId, amount }));
      
      if (profitList.length === 0) {
        toast({ title: "No Changes", description: "Enter profit amounts first", variant: "destructive" });
        return;
      }
    }
    
    addProfitMutation.mutate(profitList, {
      onSuccess: () => {
        setProfitPopupOpen(false);
        setGroupProfitAmount(0);
        setProfitAmounts({});
        setProfitsAlreadyAdded(true); // Mark that profits were added for this completion
        // Keep completedDurationGroup to show reopen button
      }
    });
  };

  // Group trades by date
  const groupedTrades = tradeHistory.reduce((acc, trade) => {
    const date = format(new Date(trade.createdAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, AdminTrade[]>);

  const historyActiveTrades = tradeHistory.filter(t => t.status === "active" || t.status === "pending");
  const historyCompletedTrades = tradeHistory.filter(t => t.status === "completed" || t.status === "closed");

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
                    Active Trades ({historyActiveTrades.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="tab-completed-trades">
                    Completed ({historyCompletedTrades.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4 mt-4">
                  {historyLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : historyActiveTrades.length === 0 ? (
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
                  {historyCompletedTrades.length === 0 ? (
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
          >
            <div className="space-y-4 sm:space-y-6">
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

              <Card className="glass-card p-4 sm:p-6">
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

                <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto">
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
            className="flex flex-col h-[calc(100vh-140px)]"
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
                {tradingAssets.map((asset, index) => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAssetIndex(index)}
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
                    <Badge className="text-[10px] px-1 py-0 bg-primary/20">{asset.duration}</Badge>
                    {tradingAssets.length > 1 && (
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
                    <div className="p-4 h-full flex flex-col">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
                        <Users className="w-4 h-4" />
                        Trading For
                      </h3>
                      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
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
              <div className="w-72 border-l border-white/10 p-4 flex flex-col gap-4 overflow-y-auto">
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

                {/* Reopen Profit Popup Button - Shows when a trade has completed but popup is closed */}
                {completedDurationGroup && !profitPopupOpen && !activeTrade && (
                  <Button
                    className="bg-primary/80 hover:bg-primary h-12 font-semibold"
                    onClick={() => {
                      if (profitsAlreadyAdded) {
                        setReopenConfirmDialogOpen(true);
                      } else {
                        setProfitPopupOpen(true);
                      }
                    }}
                    data-testid="button-reopen-profit-popup"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {profitsAlreadyAdded ? "Trade Completed" : "Add Profits"}
                  </Button>
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

        {/* Page 4: Add Profits - Full page for all users */}
        {currentPage === "add-profits" && (
          <motion.div
            key="add-profits"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="space-y-4 h-[calc(100vh-140px)] flex flex-col"
          >
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo("trade-room")}
                data-testid="button-back-from-profits"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Add Profits</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Asset badges */}
                  {completedDurationGroup?.assets.map((asset, index) => (
                    <div 
                      key={`page-asset-${asset.symbol}-${index}`}
                      className="flex items-center gap-1.5 glass-light rounded-md px-2 py-0.5"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        getAssetTypeColor(asset.assetType)
                      )}>
                        {getSymbolInitials(asset.symbol)}
                      </div>
                      <span className="text-xs font-medium">{asset.symbol}</span>
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{selectedUsers.length} users</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <Badge className="text-xs bg-primary/20">{completedDurationGroup?.durationGroup || "N/A"}</Badge>
                </div>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant={profitMode === "group" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitMode("group")}
              >
                <Users className="w-4 h-4 mr-2" />
                Group
              </Button>
              <Button
                variant={profitMode === "singular" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitMode("singular")}
              >
                <User className="w-4 h-4 mr-2" />
                Individual
              </Button>
            </div>

            {/* Group profit input */}
            {profitMode === "group" && (
              <Card className="glass-card p-4 flex-shrink-0">
                <label className="text-sm font-medium mb-2 block">
                  Profit Amount for All {selectedUsers.length} Users
                </label>
                <div className="flex gap-2 items-center">
                  <span className="text-xl font-bold text-success">$</span>
                  <Input
                    type="number"
                    value={groupProfitAmount}
                    onChange={(e) => setGroupProfitAmount(parseFloat(e.target.value) || 0)}
                    className="text-lg"
                    placeholder="Enter profit amount"
                    data-testid="input-group-profit-page"
                  />
                </div>
              </Card>
            )}

            {/* Users list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {selectedUsers.map((user) => (
                <Card key={user.id} className="glass-card p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{getUserName(user)}</div>
                      <div className="text-xs text-muted-foreground">
                        Balance: ${parseFloat(user.balance).toLocaleString()} • Trade: ${user.tradeAmount.toLocaleString()}
                      </div>
                    </div>
                    {profitMode === "group" ? (
                      <Badge className="bg-success/20 text-success">
                        +${groupProfitAmount.toLocaleString()}
                      </Badge>
                    ) : (
                      <Input
                        type="number"
                        value={profitAmounts[user.id] || 0}
                        onChange={(e) => setProfitAmounts(prev => ({
                          ...prev,
                          [user.id]: parseFloat(e.target.value) || 0
                        }))}
                        className="w-28"
                        placeholder="Profit"
                        data-testid={`input-profit-page-${user.id}`}
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2 border-t border-white/10 flex-shrink-0">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigateTo("trade-room")}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-success hover:bg-success/90"
                onClick={handlePopupAddProfit}
                disabled={addProfitMutation.isPending}
                data-testid="button-apply-profits-page"
              >
                {addProfitMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Apply Profits
                  </>
                )}
              </Button>
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

      {/* Add Profit Dialog (Legacy) */}
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

      {/* Profit Popup Dialog - Appears when a duration group completes */}
      <Dialog open={profitPopupOpen} onOpenChange={setProfitPopupOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              Trade Completed - Add Profits
            </DialogTitle>
            {completedDurationGroup && (
              <div className="space-y-2 mt-2">
                {/* Asset display */}
                <div className="flex flex-wrap items-center gap-2">
                  {completedDurationGroup.assets.map((asset, index) => (
                    <div 
                      key={`${asset.symbol}-${index}`}
                      className="flex items-center gap-2 glass-light rounded-lg px-3 py-1.5"
                      data-testid={`asset-badge-${asset.symbol}`}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        getAssetTypeColor(asset.assetType)
                      )}>
                        {getSymbolInitials(asset.symbol)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{asset.symbol}</span>
                        <span className="text-[10px] text-muted-foreground">{asset.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Duration badge */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Duration:</span>
                  <Badge className="bg-primary/20">{completedDurationGroup.durationGroup}</Badge>
                </div>
              </div>
            )}
          </DialogHeader>
          
          {/* Mode selector */}
          <div className="flex gap-2 mt-2">
            <Button
              variant={profitMode === "group" ? "default" : "outline"}
              size="sm"
              onClick={() => setProfitMode("group")}
              data-testid="button-group-mode"
            >
              <Users className="w-4 h-4 mr-2" />
              Group Profit
            </Button>
            <Button
              variant={profitMode === "singular" ? "default" : "outline"}
              size="sm"
              onClick={() => setProfitMode("singular")}
              data-testid="button-singular-mode"
            >
              <User className="w-4 h-4 mr-2" />
              Individual Profit
            </Button>
          </div>

          {profitMode === "group" ? (
            // Group mode - single profit amount applied to all
            <div className="space-y-4 py-4">
              <div className="glass-light rounded-lg p-4">
                <label className="text-sm font-medium mb-2 block">
                  Profit Amount for All Users ({selectedUsers.length})
                </label>
                <div className="flex gap-2 items-center">
                  <span className="text-lg font-bold text-success">$</span>
                  <Input
                    type="number"
                    value={groupProfitAmount}
                    onChange={(e) => setGroupProfitAmount(parseFloat(e.target.value) || 0)}
                    className="text-lg"
                    placeholder="Enter profit amount"
                    data-testid="input-group-profit"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This amount will be added to each user's balance
                </p>
              </div>

              {/* Preview users */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Users ({Math.min(selectedUsers.length, 5)} of {selectedUsers.length})</p>
                {selectedUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center gap-3 glass-light rounded-lg p-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{getUserName(user)}</div>
                    </div>
                    <Badge className="bg-success/20 text-success">
                      +${groupProfitAmount.toLocaleString()}
                    </Badge>
                  </div>
                ))}
                {selectedUsers.length > 5 && (
                  <button
                    onClick={() => {
                      setProfitPopupOpen(false);
                      navigateTo("add-profits");
                    }}
                    className="text-primary text-sm hover:underline w-full text-center py-2"
                    data-testid="link-view-all-users"
                  >
                    View all {selectedUsers.length} users to add profits
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Singular mode - individual profit per user
            <div className="space-y-4 py-4 max-h-[40vh] overflow-y-auto">
              {selectedUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-3 glass-light rounded-lg p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{getUserName(user)}</div>
                    <div className="text-xs text-muted-foreground">
                      Trade: ${user.tradeAmount.toLocaleString()}
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={profitAmounts[user.id] || 0}
                    onChange={(e) => setProfitAmounts(prev => ({
                      ...prev,
                      [user.id]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-24"
                    placeholder="Profit"
                    data-testid={`input-singular-profit-${user.id}`}
                  />
                </div>
              ))}
              {selectedUsers.length > 5 && (
                <button
                  onClick={() => {
                    setProfitPopupOpen(false);
                    navigateTo("add-profits");
                  }}
                  className="text-primary text-sm hover:underline w-full text-center py-2"
                  data-testid="link-view-all-users-singular"
                >
                  View all {selectedUsers.length} users to add individual profits
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button 
              variant="outline" 
              onClick={() => {
                setProfitPopupOpen(false);
                setGroupProfitAmount(0);
                setProfitAmounts({});
              }}
              data-testid="button-skip-profit"
            >
              Skip
            </Button>
            <Button 
              onClick={handlePopupAddProfit}
              disabled={addProfitMutation.isPending}
              className="bg-success hover:bg-success/90"
              data-testid="button-apply-profit"
            >
              {addProfitMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Apply Profit
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reopen Confirmation Dialog - When profits already added */}
      <Dialog open={reopenConfirmDialogOpen} onOpenChange={setReopenConfirmDialogOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              Profits Already Added
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              You have already added profits for this trade session. What would you like to do?
            </p>
            {completedDurationGroup && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {completedDurationGroup.assets.map((asset, index) => (
                  <div 
                    key={`confirm-asset-${asset.symbol}-${index}`}
                    className="flex items-center gap-1.5 glass-light rounded-md px-2 py-1"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      getAssetTypeColor(asset.assetType)
                    )}>
                      {getSymbolInitials(asset.symbol)}
                    </div>
                    <span className="text-xs font-medium">{asset.symbol}</span>
                  </div>
                ))}
                <Badge className="text-xs bg-success/20 text-success">Completed</Badge>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setReopenConfirmDialogOpen(false);
                navigateTo("history");
              }}
              data-testid="button-see-all-trades"
            >
              <Eye className="w-4 h-4 mr-2" />
              See All Trades
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setReopenConfirmDialogOpen(false);
                setCompletedDurationGroup(null);
                setProfitsAlreadyAdded(false);
              }}
              data-testid="button-start-new-trade"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Start New Trade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setReopenConfirmDialogOpen(false)}
              data-testid="button-cancel-reopen"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
