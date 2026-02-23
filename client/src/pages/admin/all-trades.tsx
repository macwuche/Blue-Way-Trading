import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Activity,
  X,
  Clock,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface OpenPosition {
  id: string;
  userId: string;
  symbol: string;
  direction: string;
  amount: string;
  entryPrice: string;
  volume: string;
  status: string;
  orderType: string;
  triggerPrice: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  unrealizedPnl: string | null;
  adminProfit: string | null;
  createdAt: string;
  userName: string;
  userEmail: string | null;
}

type SortField = "createdAt" | "userName" | "symbol" | "amount" | "unrealizedPnl";
type SortDirection = "asc" | "desc";

export default function AllAdminTradesPage() {
  const [, navigate] = useLocation();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [addProfitDialog, setAddProfitDialog] = useState<OpenPosition | null>(null);
  const [profitAmount, setProfitAmount] = useState("");

  const { data: positions = [], isLoading } = useQuery<OpenPosition[]>({
    queryKey: ["/api/admin/positions-open"],
    refetchInterval: 5000,
  });

  const closePositionMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const res = await apiRequest("POST", `/api/admin/positions/${positionId}/close`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions-open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions-closed"] });
    },
  });

  const addProfitMutation = useMutation({
    mutationFn: async ({ positionId, amount }: { positionId: string; amount: number }) => {
      return apiRequest("POST", `/api/admin/positions/${positionId}/add-profit`, { amount });
    },
    onSuccess: () => {
      setAddProfitDialog(null);
      setProfitAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/positions-open"] });
    },
  });

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

  const filteredPositions = useMemo(() => {
    let filtered = positions;

    if (statusFilter === "open") filtered = filtered.filter(p => p.status === "open");
    if (statusFilter === "pending") filtered = filtered.filter(p => p.status === "pending");
    if (directionFilter !== "all") filtered = filtered.filter(p => p.direction === directionFilter);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.userName.toLowerCase().includes(query) ||
        p.symbol.toLowerCase().includes(query) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(query))
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "userName":
          comparison = a.userName.localeCompare(b.userName);
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "amount":
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        case "unrealizedPnl":
          comparison = (parseFloat(a.unrealizedPnl || "0") + parseFloat(a.adminProfit || "0")) - (parseFloat(b.unrealizedPnl || "0") + parseFloat(b.adminProfit || "0"));
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [positions, sortField, sortDirection, searchQuery, statusFilter, directionFilter]);

  const openCount = positions.filter(p => p.status === "open").length;
  const pendingCount = positions.filter(p => p.status === "pending").length;
  const totalPnl = positions.filter(p => p.status === "open").reduce((s, p) => s + parseFloat(p.unrealizedPnl || "0") + parseFloat(p.adminProfit || "0"), 0);

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
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-all-orders-title">All Orders</h1>
          <p className="text-sm text-muted-foreground">Manage running trades across all users</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card p-3 text-center">
          <div className="text-2xl font-bold text-primary" data-testid="text-open-count">{openCount}</div>
          <div className="text-xs text-muted-foreground">Open</div>
        </Card>
        <Card className="glass-card p-3 text-center">
          <div className="text-2xl font-bold text-warning" data-testid="text-pending-count">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </Card>
        <Card className="glass-card p-3 text-center">
          <div className={cn("text-2xl font-bold", totalPnl >= 0 ? "text-success" : "text-destructive")} data-testid="text-total-unrealized-pnl">
            {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Unrealized P&L</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-light border-0"
            data-testid="input-search-orders"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] glass-light border-0" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-dark border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[120px] glass-light border-0" data-testid="select-direction-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-dark border-white/10">
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="text-left p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center gap-1 text-xs font-medium">Opened {getSortIcon("createdAt")}</div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("userName")}>
                  <div className="flex items-center gap-1 text-xs font-medium">User {getSortIcon("userName")}</div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("symbol")}>
                  <div className="flex items-center gap-1 text-xs font-medium">Symbol {getSortIcon("symbol")}</div>
                </th>
                <th className="text-left p-3 text-xs font-medium">Side</th>
                <th className="text-left p-3 text-xs font-medium">Type</th>
                <th className="text-right p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("amount")}>
                  <div className="flex items-center gap-1 justify-end text-xs font-medium">Amount {getSortIcon("amount")}</div>
                </th>
                <th className="text-right p-3 text-xs font-medium">Entry</th>
                <th className="text-right p-3 text-xs font-medium">SL / TP</th>
                <th className="text-right p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("unrealizedPnl")}>
                  <div className="flex items-center gap-1 justify-end text-xs font-medium">P&L {getSortIcon("unrealizedPnl")}</div>
                </th>
                <th className="text-right p-3 text-xs font-medium">Status</th>
                <th className="text-right p-3 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-8 text-muted-foreground">
                    {searchQuery ? "No orders matching your search" : "No active orders"}
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos) => {
                  const pnl = parseFloat(pos.unrealizedPnl || "0") + parseFloat(pos.adminProfit || "0");
                  return (
                    <tr key={pos.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`order-row-${pos.id}`}>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(pos.createdAt), "MMM dd, HH:mm")}
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium truncate max-w-[120px]">{pos.userName}</div>
                        {pos.userEmail && <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{pos.userEmail}</div>}
                      </td>
                      <td className="p-3 font-medium">{pos.symbol}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          pos.direction === "buy" ? "border-[#2196F3]/40 text-[#2196F3]" : "border-destructive/40 text-destructive"
                        )}>
                          {pos.direction === "buy" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {pos.direction.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] border-white/20">
                          {pos.orderType || "market"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono">${parseFloat(pos.amount).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-xs">
                        {parseFloat(pos.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-xs whitespace-nowrap">
                        {pos.stopLoss && <span className="text-destructive">SL:{parseFloat(pos.stopLoss).toFixed(2)}</span>}
                        {pos.stopLoss && pos.takeProfit && <span className="text-muted-foreground mx-1">/</span>}
                        {pos.takeProfit && <span className="text-success">TP:{parseFloat(pos.takeProfit).toFixed(2)}</span>}
                        {!pos.stopLoss && !pos.takeProfit && "—"}
                      </td>
                      <td className={cn(
                        "p-3 text-right font-mono font-semibold",
                        pos.status === "pending" ? "text-muted-foreground" : pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {pos.status === "pending" ? "—" : `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`}
                      </td>
                      <td className="p-3 text-right">
                        <Badge className={cn(
                          "text-[10px]",
                          pos.status === "open" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                        )}>
                          {pos.status === "pending" && <Clock className="w-3 h-3 mr-0.5" />}
                          {pos.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => closePositionMutation.mutate(pos.id)}
                            disabled={closePositionMutation.isPending}
                            data-testid={`button-close-${pos.id}`}
                            className="text-xs h-7 px-2"
                          >
                            <X className="w-3 h-3 mr-0.5" />
                            Close
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setAddProfitDialog(pos); setProfitAmount(""); }}
                            data-testid={`button-profit-${pos.id}`}
                            className="text-xs h-7 px-2"
                          >
                            <DollarSign className="w-3 h-3 mr-0.5" />
                            Profit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!addProfitDialog} onOpenChange={(open) => { if (!open) setAddProfitDialog(null); }}>
        <DialogContent className="glass-dark border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Profit</DialogTitle>
          </DialogHeader>
          {addProfitDialog && (
            <div className="space-y-4">
              <div className="glass-light rounded-lg p-3 space-y-1">
                <div className="text-sm font-medium">{addProfitDialog.userName}</div>
                <div className="text-xs text-muted-foreground">{addProfitDialog.symbol} • {addProfitDialog.direction.toUpperCase()} • ${parseFloat(addProfitDialog.amount).toLocaleString()}</div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground">Current P&L:</span>
                  <span className={cn("text-sm font-semibold font-mono", (parseFloat(addProfitDialog.unrealizedPnl || "0") + parseFloat(addProfitDialog.adminProfit || "0")) >= 0 ? "text-success" : "text-destructive")} data-testid="text-current-pnl">
                    {(parseFloat(addProfitDialog.unrealizedPnl || "0") + parseFloat(addProfitDialog.adminProfit || "0")) >= 0 ? "+" : ""}${Math.abs(parseFloat(addProfitDialog.unrealizedPnl || "0") + parseFloat(addProfitDialog.adminProfit || "0")).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(e.target.value)}
                    placeholder="Enter amount"
                    data-testid="input-profit-amount"
                    className="glass-light border-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="w-full bg-success/20 text-success hover:bg-success/30 border border-success/30"
                  variant="outline"
                  onClick={() => {
                    const amt = parseFloat(profitAmount);
                    if (!isNaN(amt) && amt > 0 && addProfitDialog) {
                      addProfitMutation.mutate({ positionId: addProfitDialog.id, amount: amt });
                    }
                  }}
                  disabled={addProfitMutation.isPending || !profitAmount || parseFloat(profitAmount) <= 0}
                  data-testid="button-add-profit"
                >
                  {addProfitMutation.isPending ? "Processing..." : "Add Profit"}
                </Button>
                <Button
                  className="w-full bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                  variant="outline"
                  onClick={() => {
                    const amt = parseFloat(profitAmount);
                    if (!isNaN(amt) && amt > 0 && addProfitDialog) {
                      addProfitMutation.mutate({ positionId: addProfitDialog.id, amount: -amt });
                    }
                  }}
                  disabled={addProfitMutation.isPending || !profitAmount || parseFloat(profitAmount) <= 0}
                  data-testid="button-subtract-profit"
                >
                  {addProfitMutation.isPending ? "Processing..." : "Subtract Profit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
