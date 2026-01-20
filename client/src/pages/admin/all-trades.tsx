import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface AdminTrade {
  id: string;
  sessionId: string;
  adminId: string;
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

type SortField = "createdAt" | "userName" | "email" | "symbol" | "profit";
type SortDirection = "asc" | "desc";

export default function AllAdminTradesPage() {
  const [, navigate] = useLocation();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trades = [], isLoading } = useQuery<AdminTrade[]>({
    queryKey: ["/api/admin/trades"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trades", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
  });

  const getUserName = (user?: User) => {
    if (!user) return "Unknown User";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "Unknown User";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const sortedAndFilteredTrades = useMemo(() => {
    let filtered = trades;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = trades.filter(trade => 
        getUserName(trade.user).toLowerCase().includes(query) ||
        trade.user?.email?.toLowerCase().includes(query) ||
        trade.symbol.toLowerCase().includes(query) ||
        trade.name.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "userName":
          comparison = getUserName(a.user).localeCompare(getUserName(b.user));
          break;
        case "email":
          comparison = (a.user?.email || "").localeCompare(b.user?.email || "");
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "profit":
          const profitA = parseFloat(a.profit || "0");
          const profitB = parseFloat(b.profit || "0");
          comparison = profitA - profitB;
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [trades, sortField, sortDirection, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">All Admin Trades</h1>
          <p className="text-sm text-muted-foreground">View all trades executed by admin for users</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name, email, or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-trades"
          />
        </div>
        <Badge variant="outline" className="hidden sm:flex">
          {sortedAndFilteredTrades.length} trades
        </Badge>
      </div>

      <Card className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" />
          <h3 className="font-semibold">Trade History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="sort-time"
                  >
                    Time
                    {getSortIcon("createdAt")}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort("userName")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="sort-user-name"
                  >
                    User Name
                    {getSortIcon("userName")}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort("email")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="sort-email"
                  >
                    Email
                    {getSortIcon("email")}
                  </button>
                </th>
                <th className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort("symbol")}
                    className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="sort-asset"
                  >
                    Asset
                    {getSortIcon("symbol")}
                  </button>
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">
                  Direction
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-right py-3 px-2">
                  <button
                    onClick={() => handleSort("profit")}
                    className="flex items-center justify-end w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="sort-profit"
                  >
                    Profit
                    {getSortIcon("profit")}
                  </button>
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredTrades.length > 0 ? (
                sortedAndFilteredTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="border-b border-white/5 hover:bg-white/5"
                    data-testid={`row-trade-${trade.id}`}
                  >
                    <td className="py-3 px-2 text-sm">
                      <div className="flex flex-col">
                        <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(trade.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm font-medium">
                      {getUserName(trade.user)}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {trade.user?.email || "N/A"}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                          {trade.symbol.substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{trade.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={cn(
                        "text-xs",
                        trade.direction === "higher" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      )}>
                        {trade.direction === "higher" ? (
                          <><ArrowUpRight className="w-3 h-3 mr-1" />HIGHER</>
                        ) : (
                          <><ArrowDownRight className="w-3 h-3 mr-1" />LOWER</>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-medium">
                      ${parseFloat(trade.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {trade.profit ? (
                        <span className={cn(
                          "text-sm font-medium",
                          parseFloat(trade.profit) >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {parseFloat(trade.profit) >= 0 ? "+" : ""}${parseFloat(trade.profit).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Badge className={cn(
                        "text-xs",
                        trade.status === "closed" ? "bg-success/20 text-success" : 
                        trade.status === "active" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                      )}>
                        {trade.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    {searchQuery ? "No trades matching your search" : "No admin trades yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
