import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Brain, Search, Plus, RotateCcw, Trash2, 
  CheckCircle2, XCircle, Trophy, Target,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface TradeLogicEntry {
  id: string;
  userId: string;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  currentWins: number;
  currentLosses: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export default function AdminTradeLogic() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [totalTrades, setTotalTrades] = useState(10);
  const [winTrades, setWinTrades] = useState(7);
  const [editingEntry, setEditingEntry] = useState<TradeLogicEntry | null>(null);

  const { data: tradeLogicList, isLoading } = useQuery<TradeLogicEntry[]>({
    queryKey: ["/api/admin/trade-logic"],
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: { userId: string; totalTrades: number; winTrades: number; lossTrades: number; active: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/trade-logic", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-logic"] });
      setShowAddDialog(false);
      setEditingEntry(null);
      toast({ title: "Trade logic saved", description: "Configuration has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/admin/trade-logic/${id}/reset`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-logic"] });
      toast({ title: "Counters reset", description: "Win/loss counters have been reset to zero." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/trade-logic/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-logic"] });
      toast({ title: "Deleted", description: "Trade logic entry removed." });
    },
  });

  const handleSave = () => {
    const lossTrades = totalTrades - winTrades;
    const userId = editingEntry ? editingEntry.userId : selectedUserId;
    if (!userId) {
      toast({ title: "Error", description: "Please select a user.", variant: "destructive" });
      return;
    }
    if (winTrades < 0 || winTrades > totalTrades) {
      toast({ title: "Error", description: "Win trades must be between 0 and total trades.", variant: "destructive" });
      return;
    }
    upsertMutation.mutate({
      userId,
      totalTrades,
      winTrades,
      lossTrades,
      active: true,
    });
  };

  const openEditDialog = (entry: TradeLogicEntry) => {
    setEditingEntry(entry);
    setTotalTrades(entry.totalTrades);
    setWinTrades(entry.winTrades);
    setShowAddDialog(true);
  };

  const openAddDialog = () => {
    setEditingEntry(null);
    setSelectedUserId("");
    setTotalTrades(10);
    setWinTrades(7);
    setShowAddDialog(true);
  };

  const filtered = (tradeLogicList || []).filter((entry) => {
    if (!search) return true;
    const name = `${entry.user?.firstName || ""} ${entry.user?.lastName || ""}`.toLowerCase();
    const email = (entry.user?.email || "").toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const usersWithoutLogic = (allUsers || []).filter(
    (u) => !(tradeLogicList || []).some((l) => l.userId === u.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-trade-logic-title">
            <Brain className="w-6 h-6 text-primary" />
            Trade Logic
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure win/loss outcomes per user during their trading session
          </p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-trade-logic">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-trade-logic"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {search ? "No matching trade logic entries found." : "No trade logic configured yet. Add a user to get started."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => {
            const completedTrades = entry.currentWins + entry.currentLosses;
            const progress = entry.totalTrades > 0 ? (completedTrades / entry.totalTrades) * 100 : 0;
            const userName = `${entry.user?.firstName || "Unknown"} ${entry.user?.lastName || ""}`.trim();
            const initials = `${(entry.user?.firstName || "U")[0]}${(entry.user?.lastName || "")[0] || ""}`;

            return (
              <Card key={entry.id} className="p-4" data-testid={`card-trade-logic-${entry.id}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold truncate" data-testid={`text-user-name-${entry.id}`}>
                        {userName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {entry.user?.email || entry.userId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Trophy className="w-3 h-3 text-green-500" />
                        <span data-testid={`text-wins-${entry.id}`}>{entry.winTrades}W</span>
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span data-testid={`text-losses-${entry.id}`}>{entry.lossTrades}L</span>
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Target className="w-3 h-3" />
                        <span>{entry.totalTrades} total</span>
                      </Badge>
                    </div>

                    <Badge 
                      variant={entry.active ? "default" : "secondary"}
                      data-testid={`badge-status-${entry.id}`}
                    >
                      {entry.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(entry)}
                      data-testid={`button-edit-${entry.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => resetMutation.mutate(entry.id)}
                      data-testid={`button-reset-${entry.id}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      data-testid={`button-delete-${entry.id}`}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Session Progress</span>
                    <span>{completedTrades} / {entry.totalTrades} trades completed</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, progress)}%`,
                        background: `linear-gradient(90deg, #22c55e ${entry.totalTrades > 0 ? (entry.currentWins / entry.totalTrades) * 100 : 0}%, #ef4444 ${entry.totalTrades > 0 ? (entry.currentWins / entry.totalTrades) * 100 : 0}%)`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">
                        Wins: <span className="font-semibold text-foreground" data-testid={`text-current-wins-${entry.id}`}>{entry.currentWins}</span> / {entry.winTrades}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">
                        Losses: <span className="font-semibold text-foreground" data-testid={`text-current-losses-${entry.id}`}>{entry.currentLosses}</span> / {entry.lossTrades}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingEntry ? "Edit Trade Logic" : "Add Trade Logic"}
            </DialogTitle>
            <DialogDescription>
              Configure how many trades will be wins vs losses for this user's trading session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingEntry && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger data-testid="select-user">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usersWithoutLogic.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName || ""} {u.lastName || ""} ({u.email || u.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingEntry && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(editingEntry.user?.firstName || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {editingEntry.user?.firstName} {editingEntry.user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{editingEntry.user?.email}</div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Total Trades in Session</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={totalTrades}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setTotalTrades(val);
                  if (winTrades > val) setWinTrades(val);
                }}
                data-testid="input-total-trades"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Win Trades</label>
              <Input
                type="number"
                min={0}
                max={totalTrades}
                value={winTrades}
                onChange={(e) => setWinTrades(Math.min(totalTrades, Math.max(0, parseInt(e.target.value) || 0)))}
                data-testid="input-win-trades"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Loss trades: {totalTrades - winTrades} (auto-calculated)
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Preview</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{winTrades} Wins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">{totalTrades - winTrades} Losses</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">{totalTrades} Total</span>
                </div>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Win rate: {totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-cancel-dialog">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              data-testid="button-save-trade-logic"
            >
              {upsertMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
