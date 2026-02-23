import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown,
  ArrowUpRight, ArrowDownRight, Calendar, Filter
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ClosedPosition {
  id: string;
  userId: string;
  symbol: string;
  direction: string;
  amount: string;
  entryPrice: string;
  exitPrice: string | null;
  volume: string;
  realizedPnl: string | null;
  status: string;
  orderType: string;
  stopLoss: string | null;
  takeProfit: string | null;
  closeReason: string | null;
  createdAt: string;
  closedAt: string | null;
  userName: string;
  userEmail: string | null;
}

type SortField = "closedAt" | "symbol" | "amount" | "realizedPnl" | "userName";
type SortDir = "asc" | "desc";

export default function AdminOrderHistory() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("closedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: positions = [], isLoading } = useQuery<ClosedPosition[]>({
    queryKey: ["/api/admin/positions-closed"],
  });

  const filteredTrades = useMemo(() => {
    let result = positions;

    if (directionFilter !== "all") result = result.filter(p => p.direction === directionFilter);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.symbol.toLowerCase().includes(q) ||
        p.userName.toLowerCase().includes(q) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "closedAt":
          aVal = a.closedAt ? new Date(a.closedAt).getTime() : 0;
          bVal = b.closedAt ? new Date(b.closedAt).getTime() : 0;
          break;
        case "symbol":
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case "amount":
          aVal = parseFloat(a.amount);
          bVal = parseFloat(b.amount);
          break;
        case "realizedPnl":
          aVal = parseFloat(a.realizedPnl || "0");
          bVal = parseFloat(b.realizedPnl || "0");
          break;
        case "userName":
          aVal = a.userName;
          bVal = b.userName;
          break;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [positions, search, directionFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const totalPnl = filteredTrades.reduce((sum, t) => sum + parseFloat(t.realizedPnl || "0"), 0);
  const winCount = filteredTrades.filter(t => parseFloat(t.realizedPnl || "0") > 0).length;
  const lossCount = filteredTrades.filter(t => parseFloat(t.realizedPnl || "0") < 0).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted/20 rounded animate-pulse w-48" />
        <div className="h-64 bg-muted/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-order-history-title">Order History</h2>
          <p className="text-sm text-muted-foreground">{filteredTrades.length} closed orders</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="glass-card p-3 text-center">
          <div className="text-2xl font-bold" data-testid="text-total-orders">{filteredTrades.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
        <Card className="glass-card p-3 text-center">
          <div className="text-2xl font-bold text-success" data-testid="text-win-count">{winCount}</div>
          <div className="text-xs text-muted-foreground">Wins</div>
        </Card>
        <Card className="glass-card p-3 text-center">
          <div className="text-2xl font-bold text-destructive" data-testid="text-loss-count">{lossCount}</div>
          <div className="text-xs text-muted-foreground">Losses</div>
        </Card>
        <Card className="glass-card p-3 text-center">
          <div className={cn("text-2xl font-bold", totalPnl >= 0 ? "text-success" : "text-destructive")} data-testid="text-total-pnl">
            {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Total P&L</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by symbol or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 glass-light border-0"
            data-testid="input-order-history-search"
          />
        </div>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[120px] glass-light border-0" data-testid="select-direction-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-dark border-white/10">
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="buy">Buy Only</SelectItem>
            <SelectItem value="sell">Sell Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="text-left p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("closedAt")}>
                  <div className="flex items-center gap-1 text-xs font-medium">Closed <SortIcon field="closedAt" /></div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("userName")}>
                  <div className="flex items-center gap-1 text-xs font-medium">User <SortIcon field="userName" /></div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("symbol")}>
                  <div className="flex items-center gap-1 text-xs font-medium">Symbol <SortIcon field="symbol" /></div>
                </th>
                <th className="text-left p-3 text-xs font-medium">Side</th>
                <th className="text-left p-3 text-xs font-medium">Type</th>
                <th className="text-right p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("amount")}>
                  <div className="flex items-center gap-1 justify-end text-xs font-medium">Amount <SortIcon field="amount" /></div>
                </th>
                <th className="text-right p-3 text-xs font-medium">Entry</th>
                <th className="text-right p-3 text-xs font-medium">Exit</th>
                <th className="text-right p-3 text-xs font-medium">SL / TP</th>
                <th className="text-left p-3 text-xs font-medium">Reason</th>
                <th className="text-right p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("realizedPnl")}>
                  <div className="flex items-center gap-1 justify-end text-xs font-medium">P&L <SortIcon field="realizedPnl" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-8 text-muted-foreground">
                    No closed orders found
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const pnl = parseFloat(trade.realizedPnl || "0");
                  return (
                    <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" data-testid={`order-row-${trade.id}`}>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {trade.closedAt ? format(new Date(trade.closedAt), "MMM dd, HH:mm") : "—"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium truncate max-w-[120px]">{trade.userName}</div>
                        {trade.userEmail && <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{trade.userEmail}</div>}
                      </td>
                      <td className="p-3 font-medium">{trade.symbol}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          trade.direction === "buy" ? "border-[#2196F3]/40 text-[#2196F3]" : "border-destructive/40 text-destructive"
                        )}>
                          {trade.direction === "buy" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {trade.direction.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] border-white/20">
                          {trade.orderType || "market"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono">${parseFloat(trade.amount).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-xs">{parseFloat(trade.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono text-xs">{trade.exitPrice ? parseFloat(trade.exitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="p-3 text-right text-xs whitespace-nowrap">
                        {trade.stopLoss && <span className="text-destructive">SL:{parseFloat(trade.stopLoss).toFixed(2)}</span>}
                        {trade.stopLoss && trade.takeProfit && <span className="text-muted-foreground mx-1">/</span>}
                        {trade.takeProfit && <span className="text-success">TP:{parseFloat(trade.takeProfit).toFixed(2)}</span>}
                        {!trade.stopLoss && !trade.takeProfit && "—"}
                      </td>
                      <td className="p-3 text-xs">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          trade.closeReason === "take_profit" ? "border-success/40 text-success" :
                          trade.closeReason === "stop_loss" ? "border-destructive/40 text-destructive" :
                          "border-white/20"
                        )}>
                          {trade.closeReason === "take_profit" ? "TP Hit" :
                           trade.closeReason === "stop_loss" ? "SL Hit" :
                           trade.closeReason === "manual" ? "Manual" :
                           trade.closeReason === "admin_override" ? "Admin" :
                           trade.closeReason || "—"}
                        </Badge>
                      </td>
                      <td className={cn(
                        "p-3 text-right font-mono font-semibold",
                        pnl >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
