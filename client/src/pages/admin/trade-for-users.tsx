import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Check, ChevronRight, ChevronLeft, ArrowUp, ArrowDown,
  Clock, Plus, X, DollarSign, TrendingUp, TrendingDown, History,
  ChevronDown, Activity, Minus, Copy, Wallet, User, RotateCcw, Eye, PlayCircle, AlertTriangle,
  CandlestickChart as CandlestickIcon, LineChart, AreaChart
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
import { CandlestickChart, type IndicatorSettings, type ChartType } from "@/components/candlestick-chart";
import { MarketModal } from "@/components/market-modal";
import { AssetInfoPanel } from "@/components/asset-info-panel";
import { cn } from "@/lib/utils";
import { useTradeNotification, TradeNotificationContainer } from "@/components/trade-notification";
import Lottie from "lottie-react";
import confettiAnimation from "@/assets/confetti.json";
import profitSoundUrl from "@assets/Audio_2026_02_22-1_1771787287153.mp3";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Asset, formatPrice } from "@/lib/market-data";
import { useMarketData } from "@/hooks/use-market-data";
import { format } from "date-fns";
import type { UserPosition } from "@shared/schema";

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  balance: string;
  vipLevel: string | null;
}

interface SelectedUser extends UserData {
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
  user?: UserData;
}

interface CompletedAsset {
  symbol: string;
  name: string;
  assetType: string;
}

interface CompletedTradeGroup {
  trades: AdminTrade[];
  assets: CompletedAsset[];
  completedAt: Date;
}

interface BatchPositionIds {
  positionIds: string[];
  symbol: string;
  direction: string;
}

const getSymbolInitials = (symbol: string): string => {
  if (symbol.includes("/")) {
    const parts = symbol.split("/");
    return parts[0].slice(0, 2);
  }
  return symbol.slice(0, 2);
};

const getAssetTypeColor = (assetType: string): string => {
  switch (assetType.toLowerCase()) {
    case 'crypto': return 'text-yellow-500 bg-yellow-500/20';
    case 'forex': return 'text-emerald-500 bg-emerald-500/20';
    case 'stocks': return 'text-blue-500 bg-blue-500/20';
    case 'stock': return 'text-blue-500 bg-blue-500/20';
    case 'etf': return 'text-purple-500 bg-purple-500/20';
    default: return 'text-primary bg-primary/20';
  }
};

type PageView = "history" | "select-users" | "trade-room" | "add-profits";

export default function TradeForUsers() {
  const [currentPage, setCurrentPage] = useState<PageView>("history");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const notify = useTradeNotification();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { cryptoAssets, allAssets } = useMarketData({ refreshInterval: 5000 });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [defaultAmount, setDefaultAmount] = useState(100);

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_trade_session_id');
    }
    return null;
  });

  const [openAssets, setOpenAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [volume, setVolume] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [triggerPrice, setTriggerPrice] = useState<string>("");
  const [executionType, setExecutionType] = useState("market");
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    alligator: false,
    movingAverage: false,
    ema: false,
    maPeriod: 20,
    emaPeriod: 12,
  });
  const [chartType, setChartType] = useState<ChartType>("candlestick");

  const [batchPositionIds, setBatchPositionIds] = useState<BatchPositionIds[]>([]);

  const [profitPopupOpen, setProfitPopupOpen] = useState(false);
  const [profitDialogOpen, setProfitDialogOpen] = useState(false);
  const [completedTradeGroup, setCompletedTradeGroup] = useState<CompletedTradeGroup | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_pending_profit_trade');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.assets)) {
            return {
              trades: parsed.trades || [],
              assets: parsed.assets,
              completedAt: parsed.completedAt ? new Date(parsed.completedAt) : new Date(),
            };
          }
        } catch { return null; }
      }
    }
    return null;
  });
  const [profitMode, setProfitMode] = useState<"group" | "singular">("group");
  const [profitAmounts, setProfitAmounts] = useState<Record<string, number>>({});
  const [groupProfitAmount, setGroupProfitAmount] = useState(0);
  const [profitsAlreadyAdded, setProfitsAlreadyAdded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_profits_already_added') === 'true';
    }
    return false;
  });
  const [reopenConfirmDialogOpen, setReopenConfirmDialogOpen] = useState(false);

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
    if (selectedAsset) {
      setVolume(selectedAsset.type === "forex" ? 0.01 : 1);
    }
  }, [selectedAsset?.symbol]);

  const totalTradeAmount = selectedUsers.reduce((sum, u) => sum + u.tradeAmount, 0);
  const profitPercent = 87;
  const potentialProfit = (amount * (profitPercent / 100)).toFixed(2);

  const { data: users = [], isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users-with-balance"],
  });

  const { data: tradeHistory = [], isLoading: historyLoading } = useQuery<AdminTrade[]>({
    queryKey: ["/api/admin/trades-history"],
  });

  const representativeUserId = selectedUsers.length > 0 ? selectedUsers[0].id : null;

  const { data: openPositions = [] } = useQuery<UserPosition[]>({
    queryKey: ["/api/admin/positions", representativeUserId, "open"],
    queryFn: async () => {
      if (!representativeUserId) return [];
      const res = await fetch(`/api/admin/positions/${representativeUserId}?status=open`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!representativeUserId && currentPage === "trade-room",
    refetchInterval: 2000,
  });

  const { data: pendingPositions = [] } = useQuery<UserPosition[]>({
    queryKey: ["/api/admin/positions", representativeUserId, "pending"],
    queryFn: async () => {
      if (!representativeUserId) return [];
      const res = await fetch(`/api/admin/positions/${representativeUserId}?status=pending`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!representativeUserId && currentPage === "trade-room",
    refetchInterval: 3000,
  });

  const adminOpenPositions = openPositions.filter(p => p.openedByAdmin);
  const hasActivePositions = adminOpenPositions.length > 0;

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('admin_trade_session_id', sessionId);
    } else {
      localStorage.removeItem('admin_trade_session_id');
    }
  }, [sessionId]);

  useEffect(() => {
    if (completedTradeGroup) {
      localStorage.setItem('admin_pending_profit_trade', JSON.stringify(completedTradeGroup));
    } else {
      localStorage.removeItem('admin_pending_profit_trade');
    }
  }, [completedTradeGroup]);

  useEffect(() => {
    if (profitsAlreadyAdded) {
      localStorage.setItem('admin_profits_already_added', 'true');
    } else {
      localStorage.removeItem('admin_profits_already_added');
    }
  }, [profitsAlreadyAdded]);

  const { data: sessionData, isLoading: sessionLoading, isError: sessionError, isFetched: sessionFetched } = useQuery<{
    id: string;
    users: { userId: string; tradeAmount: string; user?: UserData }[];
    status: string;
  }>({
    queryKey: ["/api/admin/trade-sessions", sessionId],
    enabled: !!sessionId && selectedUsers.length === 0,
    retry: false,
  });

  useEffect(() => {
    if (sessionId && selectedUsers.length === 0 && sessionFetched && !sessionLoading) {
      if (sessionError || !sessionData) {
        localStorage.removeItem('admin_trade_session_id');
        setSessionId(null);
        setCurrentPage("history");
      }
    }
  }, [sessionError, sessionId, sessionLoading, sessionData, sessionFetched, selectedUsers.length]);

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
      if (sessionData.status === "active" && currentPage === "history") {
        setCurrentPage("trade-room");
      }
    }
  }, [sessionData, selectedUsers.length, currentPage]);

  const createSessionMutation = useMutation({
    mutationFn: async (users: { userId: string; tradeAmount: string }[]) => {
      const res = await apiRequest("POST", "/api/admin/trade-sessions", { users });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
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
      notify({ type: "success", title: "Session Created", description: "You can now trade for the selected users" });
    },
    onError: (error: any) => {
      notify({ type: "error", title: "Error", description: error?.message || "Failed to create session" });
    },
  });

  const openPositionMutation = useMutation({
    mutationFn: async (data: {
      symbol: string;
      name: string;
      assetType: string;
      direction: "buy" | "sell";
      orderType: string;
      entryPrice: number;
      volume: number;
      stopLoss?: number;
      takeProfit?: number;
      triggerPrice?: number;
    }): Promise<{ positionIds: string[] }> => {
      const positionIds: string[] = [];
      
      for (const user of selectedUsers) {
        try {
          const res = await apiRequest("POST", "/api/admin/positions/open", {
            userId: user.id,
            symbol: data.symbol,
            name: data.name,
            assetType: data.assetType,
            direction: data.direction,
            orderType: data.orderType,
            amount: user.tradeAmount,
            volume: data.volume || 1,
            entryPrice: data.entryPrice,
            triggerPrice: data.triggerPrice,
            stopLoss: data.stopLoss,
            takeProfit: data.takeProfit,
          });
          const result = await res.json();
          if (result.id) {
            positionIds.push(result.id);
          }
        } catch (err: any) {
          console.error(`Failed to open position for user ${user.id}:`, err);
        }
      }
      
      return { positionIds };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });

      if (result.positionIds.length > 0) {
        setBatchPositionIds(prev => [...prev, {
          positionIds: result.positionIds,
          symbol: variables.symbol,
          direction: variables.direction,
        }]);
      }
      
      notify({ type: "position_opened", title: "Positions Opened", description: `Opened ${result.positionIds.length} position(s) for ${selectedUsers.length} user(s)` });
    },
    onError: (error: any) => {
      notify({ type: "error", title: "Trade Failed", description: error?.message || "Failed to open positions" });
    },
  });

  const closePositionMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const res = await apiRequest("POST", `/api/admin/positions/${positionId}/close`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });
      const pnl = parseFloat(data?.realizedPnl || "0");
      if (pnl > 0) {
        setShowConfetti(true);
        const audio = new Audio(profitSoundUrl);
        audio.volume = 0.7;
        audio.play().catch(() => {});
      }
      notify({
        type: "position_closed",
        title: "Position Closed",
        description: `${data?.symbol || "Position"} closed`,
        pnl: isNaN(pnl) ? undefined : pnl,
      });

      if (adminOpenPositions.length <= 1) {
        const closedSymbol = data?.symbol || selectedAsset?.symbol || "Unknown";
        const asset = allAssets.find(a => a.symbol === closedSymbol);
        const assets: CompletedAsset[] = [{
          symbol: closedSymbol,
          name: asset?.name || closedSymbol,
          assetType: asset?.type || "crypto",
        }];
        setProfitsAlreadyAdded(false);
        setProfitPopupOpen(true);
        setCompletedTradeGroup({
          trades: [],
          assets,
          completedAt: new Date(),
        });
      }
    },
    onError: (error: any) => {
      notify({ type: "error", title: "Close Failed", description: error?.message || "Failed to close position" });
    },
  });

  const addProfitMutation = useMutation({
    mutationFn: async (profitAmounts: { userId: string; amount: number }[]) => {
      if (!sessionId) throw new Error("No active session");
      return apiRequest("POST", `/api/admin/trade-sessions/${sessionId}/add-profit`, { profitAmounts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-with-balance"] });
      notify({ type: "success", title: "Profit Added", description: "User balances updated successfully" });
      setProfitDialogOpen(false);
      setProfitAmounts({});
    },
    onError: (error: any) => {
      notify({ type: "error", title: "Error", description: error?.message || "Failed to add profit" });
    },
  });

  const filteredUsers = users.filter(user => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const getUserName = (user: UserData) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "Unknown";
  };

  const getInitials = (user: UserData) => {
    const name = getUserName(user);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleUserSelection = (user: UserData) => {
    const existing = selectedUsers.find(u => u.id === user.id);
    if (existing) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, { ...user, tradeAmount: defaultAmount }]);
    }
  };

  const updateUserAmount = (userId: string, amt: number) => {
    setSelectedUsers(selectedUsers.map(u => 
      u.id === userId ? { ...u, tradeAmount: amt } : u
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
    setBatchPositionIds([]);
    localStorage.removeItem('admin_trade_session_id');
    navigateTo("select-users");
  };

  const handleProceedToTrading = () => {
    if (selectedUsers.length === 0) {
      notify({ type: "error", title: "No Users Selected", description: "Please select at least one user" });
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
    if (selectedAsset?.symbol === asset.symbol && newAssets.length > 0) {
      setSelectedAsset(newAssets[0]);
    }
  };

  const handleTrade = async (direction: "buy" | "sell") => {
    if (!selectedAsset) return;

    if (amount <= 0) {
      notify({ type: "error", title: "Invalid Amount", description: "Please enter a valid trade amount." });
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
      entryPrice: selectedAsset.price,
      volume: volume || 1,
      stopLoss: parsedSL,
      takeProfit: parsedTP,
      triggerPrice: parsedTrigger,
    });
  };

  const handleClosePosition = async (positionId: string) => {
    closePositionMutation.mutate(positionId);
  };

  const handleCloseBatchPositions = async (batch: BatchPositionIds) => {
    for (const posId of batch.positionIds) {
      try {
        await apiRequest("POST", `/api/admin/positions/${posId}/close`, {});
      } catch (err) {
        console.error(`Failed to close position ${posId}:`, err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/admin/positions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });

    const asset = allAssets.find(a => a.symbol === batch.symbol);
    const assets: CompletedAsset[] = [{
      symbol: batch.symbol,
      name: asset?.name || batch.symbol,
      assetType: asset?.type || "crypto",
    }];

    setProfitsAlreadyAdded(false);
    setProfitPopupOpen(true);
    setCompletedTradeGroup({
      trades: [],
      assets,
      completedAt: new Date(),
    });

    setBatchPositionIds(prev => prev.filter(b => b !== batch));

    notify({
      type: "position_closed",
      title: "Positions Closed",
      description: `Closed ${batch.positionIds.length} position(s) on ${batch.symbol}`,
    });
  };

  const handleCloseAllOpenPositions = async () => {
    if (adminOpenPositions.length === 0) return;

    for (const pos of adminOpenPositions) {
      try {
        await apiRequest("POST", `/api/admin/positions/${pos.id}/close`, {});
      } catch (err) {
        console.error(`Failed to close position ${pos.id}:`, err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/admin/positions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/trades-history"] });

    const uniqueSymbols = Array.from(new Set(adminOpenPositions.map(p => p.symbol)));
    const assets: CompletedAsset[] = uniqueSymbols.map(sym => {
      const pos = adminOpenPositions.find(p => p.symbol === sym);
      return {
        symbol: sym,
        name: pos?.name || sym,
        assetType: pos?.assetType || "crypto",
      };
    });

    setProfitsAlreadyAdded(false);
    setProfitPopupOpen(true);
    setCompletedTradeGroup({
      trades: [],
      assets,
      completedAt: new Date(),
    });

    setBatchPositionIds([]);

    notify({
      type: "position_closed",
      title: "All Positions Closed",
      description: `Closed ${adminOpenPositions.length} position(s)`,
    });
  };

  const handleOpenProfitDialog = () => {
    const amounts: Record<string, number> = {};
    selectedUsers.forEach(u => { amounts[u.id] = 0; });
    setProfitAmounts(amounts);
    setProfitDialogOpen(true);
  };

  const handleAddProfit = () => {
    const profitList = Object.entries(profitAmounts)
      .filter(([_, amt]) => amt !== 0)
      .map(([userId, amt]) => ({ userId, amount: amt }));
    
    if (profitList.length === 0) {
      notify({ type: "error", title: "No Changes", description: "Enter profit amounts first" });
      return;
    }
    
    addProfitMutation.mutate(profitList);
  };

  const handlePopupAddProfit = () => {
    let profitList: { userId: string; amount: number }[] = [];
    
    if (profitMode === "group") {
      if (groupProfitAmount === 0) {
        notify({ type: "error", title: "No Profit", description: "Enter a profit amount first" });
        return;
      }
      profitList = selectedUsers.map(u => ({ userId: u.id, amount: groupProfitAmount }));
    } else {
      profitList = Object.entries(profitAmounts)
        .filter(([_, amt]) => amt !== 0)
        .map(([userId, amt]) => ({ userId, amount: amt }));
      
      if (profitList.length === 0) {
        notify({ type: "error", title: "No Changes", description: "Enter profit amounts first" });
        return;
      }
    }
    
    addProfitMutation.mutate(profitList, {
      onSuccess: () => {
        setProfitPopupOpen(false);
        setGroupProfitAmount(0);
        setProfitAmounts({});
        setProfitsAlreadyAdded(true);
      }
    });
  };

  const groupedTrades = tradeHistory.reduce((acc, trade) => {
    const date = format(new Date(trade.createdAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(trade);
    return acc;
  }, {} as Record<string, AdminTrade[]>);

  const historyActiveTrades = tradeHistory.filter(t => t.status === "active" || t.status === "pending");
  const historyCompletedTrades = tradeHistory.filter(t => t.status === "completed" || t.status === "closed");

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  const totalOpenMargin = adminOpenPositions.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalUnrealizedPnl = adminOpenPositions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl || "0") + parseFloat(p.adminProfit || "0"), 0);

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
    <div className="h-full flex flex-col overflow-hidden">
      <AnimatePresence mode="wait" custom={slideDirection}>
        {currentPage === "history" && (
          <motion.div
            key="history"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Trade for Users</h2>
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

        {currentPage === "select-users" && (
          <motion.div
            key="select-users"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="h-full overflow-y-auto"
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

        {currentPage === "trade-room" && selectedAsset && (
          <motion.div
            key="trade-room"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="flex flex-col h-full"
          >
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

            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
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
                    <div className="flex items-center gap-1 glass-light rounded-lg p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setChartType("candlestick")}
                        data-testid="button-chart-candlestick-admin"
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
                        data-testid="button-chart-line-admin"
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
                        data-testid="button-chart-area-admin"
                        className={cn(
                          chartType === "area" ? "text-primary bg-primary/10" : "text-muted-foreground"
                        )}
                      >
                        <AreaChart className="w-4 h-4" />
                      </Button>
                    </div>

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
                              data-testid="switch-alligator-admin"
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
                              data-testid="switch-ma-admin"
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
                              data-testid="switch-ema-admin"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

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

                <div className="flex items-center gap-4 px-4 py-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ask</span>
                    <span className="font-mono text-sm" data-testid="text-ask-price">{formatPrice(selectedAsset.price * 1.0001)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">bid</span>
                    <span className="font-mono text-sm" data-testid="text-bid-price">{formatPrice(selectedAsset.price * 0.9999)}</span>
                  </div>
                </div>
              </div>

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
                          <div key={user.id} className="glass-light p-3 rounded-lg" data-testid={`user-panel-${user.id}`}>
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
                              {selectedUsers.length > 1 && (
                                <button
                                  onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                                  data-testid={`button-remove-user-${user.id}`}
                                  className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MetaTrader-Style Trading Panel */}
              <div className="w-80 border-l border-white/10 flex flex-col glass-dark overflow-y-auto">
                <div className="p-3 border-b border-white/10">
                  <Select value={executionType} onValueChange={(val) => { setExecutionType(val); if (val === "market") setTriggerPrice(""); }}>
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

                <div className="p-3 border-b border-white/10">
                  <div className="glass-light rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Trading for</div>
                    <div className="text-lg font-bold" data-testid="text-trading-for-count">{selectedUsers.length} user(s)</div>
                    <div className="text-xs text-muted-foreground">
                      Total: ${totalTradeAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="px-3 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Volume</span>
                    <span className="text-xs text-muted-foreground">{selectedAsset?.type === "forex" ? "Lots" : selectedAsset?.type === "crypto" ? "Units" : "Shares"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setVolume(Math.max(0, volume - (selectedAsset?.type === "forex" ? 0.01 : 1)))}
                      data-testid="button-volume-minus"
                      className="glass-light rounded px-2 py-1.5 text-muted-foreground hover:text-white transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={volume}
                      onChange={(e) => setVolume(Math.max(0, parseFloat(e.target.value) || 0))}
                      data-testid="input-volume"
                      className="glass-light rounded px-2 py-1.5 text-sm text-center flex-1 bg-transparent outline-none"
                    />
                    <button
                      onClick={() => setVolume(volume + (selectedAsset?.type === "forex" ? 0.01 : 1))}
                      data-testid="button-volume-plus"
                      className="glass-light rounded px-2 py-1.5 text-muted-foreground hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

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

                <div className="px-3 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Trading Amount</span>
                    <span className="text-xs text-muted-foreground">Per user</span>
                  </div>
                  <div className="space-y-2">
                    <div className="glass-light rounded-lg p-2 flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                        data-testid="input-amount"
                        className="bg-transparent text-lg font-semibold text-center flex-1 outline-none"
                      />
                    </div>
                    <Slider
                      value={[amount]}
                      onValueChange={handleSliderChange}
                      min={1}
                      max={10000}
                      step={1}
                      data-testid="slider-amount"
                    />
                  </div>
                </div>

                <div className="px-3 pt-4">
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
                {adminOpenPositions.length > 0 && (
                  <div className="px-3 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Open Positions ({adminOpenPositions.length})</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCloseAllOpenPositions}
                        data-testid="button-close-all-positions"
                        className="text-xs h-7"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Close All
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {adminOpenPositions.map((pos) => {
                        const pnl = parseFloat(pos.unrealizedPnl || "0") + parseFloat(pos.adminProfit || "0");
                        return (
                          <div
                            key={pos.id}
                            className={cn(
                              "glass-light rounded-lg p-2.5 border",
                              pos.direction === "buy" ? "border-[#2196F3]/30" : "border-destructive/30"
                            )}
                            data-testid={`position-card-${pos.id}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                                  pos.direction === "buy" ? "bg-[#2196F3]/20 text-[#2196F3]" : "bg-destructive/20 text-destructive"
                                )}>
                                  {pos.direction.toUpperCase()}
                                </span>
                                <span className="text-sm font-medium">{pos.symbol}</span>
                              </div>
                              <span className={cn(
                                "text-sm font-bold",
                                pnl >= 0 ? "text-success" : "text-destructive"
                              )} data-testid={`text-pnl-${pos.id}`}>
                                {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Entry: {formatPrice(parseFloat(pos.entryPrice))}</span>
                              <span>${parseFloat(pos.amount).toLocaleString()}</span>
                            </div>
                            {(pos.stopLoss || pos.takeProfit) && (
                              <div className="flex gap-3 text-[10px] mt-0.5">
                                {pos.stopLoss && <span className="text-destructive">SL: {formatPrice(parseFloat(pos.stopLoss))}</span>}
                                {pos.takeProfit && <span className="text-success">TP: {formatPrice(parseFloat(pos.takeProfit))}</span>}
                              </div>
                            )}
                            <div className="mt-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClosePosition(pos.id)}
                                data-testid={`button-close-position-${pos.id}`}
                                className="w-full text-xs h-7"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Close
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pending Orders */}
                {pendingPositions.length > 0 && (
                  <div className="px-3 pt-3">
                    <span className="text-xs text-muted-foreground font-medium mb-2 block">Pending Orders ({pendingPositions.length})</span>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {pendingPositions.map((pos) => (
                        <div
                          key={pos.id}
                          className="glass-light rounded-lg p-2.5 border border-warning/30"
                          data-testid={`pending-order-${pos.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                                {pos.orderType?.toUpperCase()} {pos.direction.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium">{pos.symbol}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              @ {pos.triggerPrice ? formatPrice(parseFloat(pos.triggerPrice)) : "---"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {completedTradeGroup && !profitPopupOpen && adminOpenPositions.length === 0 && (
                  <div className="px-3 pt-3">
                    <Button
                      className="w-full bg-primary/80 hover:bg-primary h-12 font-semibold"
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
                  </div>
                )}

                <div className="px-3 pt-3 mt-auto">
                  <div className="glass-light rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Users</span>
                        <span className="text-sm font-semibold" data-testid="text-users-count">
                          {selectedUsers.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Combined Balance</span>
                        <span className="text-sm font-semibold" data-testid="text-combined-balance">
                          ${selectedUsers.reduce((s, u) => s + parseFloat(u.balance), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Orders Margin</span>
                        <span className="text-sm font-semibold text-warning" data-testid="text-orders-margin">
                          ${(totalOpenMargin * selectedUsers.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Unrealized P&L</span>
                        <span className={cn(
                          "text-sm font-semibold",
                          totalUnrealizedPnl >= 0 ? "text-success" : "text-destructive"
                        )} data-testid="text-unrealized-pnl">
                          {totalUnrealizedPnl >= 0 ? "+" : ""}${formatPrice(Math.abs(totalUnrealizedPnl))}
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
          </motion.div>
        )}

        {currentPage === "add-profits" && (
          <motion.div
            key="add-profits"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className="space-y-4 h-full flex flex-col"
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
                  {completedTradeGroup?.assets.map((asset, index) => (
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
                  <span className="text-xs text-muted-foreground">&bull;</span>
                  <span className="text-xs text-muted-foreground">{selectedUsers.length} users</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant={profitMode === "group" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitMode("group")}
                data-testid="button-group-mode-page"
              >
                <Users className="w-4 h-4 mr-2" />
                Group
              </Button>
              <Button
                variant={profitMode === "singular" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfitMode("singular")}
                data-testid="button-singular-mode-page"
              >
                <User className="w-4 h-4 mr-2" />
                Individual
              </Button>
            </div>

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
                        Balance: ${parseFloat(user.balance).toLocaleString()} &bull; Trade: ${user.tradeAmount.toLocaleString()}
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

            <div className="flex gap-3 pt-2 border-t border-white/10 flex-shrink-0">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigateTo("trade-room")}
                data-testid="button-cancel-profits-page"
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

      <MarketModal
        open={marketModalOpen}
        onOpenChange={setMarketModalOpen}
        onSelectAsset={handleSelectAsset}
      />

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
            <Button variant="outline" onClick={() => setProfitDialogOpen(false)} data-testid="button-cancel-profit-dialog">
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

      <Dialog open={profitPopupOpen} onOpenChange={setProfitPopupOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              Trade Completed - Add Profits
            </DialogTitle>
            {completedTradeGroup && (
              <div className="space-y-2 mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {completedTradeGroup.assets.map((asset, index) => (
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
              </div>
            )}
          </DialogHeader>
          
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
            {completedTradeGroup && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {completedTradeGroup.assets.map((asset, index) => (
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
                setCompletedTradeGroup(null);
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
