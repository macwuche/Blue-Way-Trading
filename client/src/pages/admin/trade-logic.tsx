import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Brain, RotateCcw, CheckCircle2, XCircle, Trophy, Target,
  Shield, Zap, Settings2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

interface GlobalTradeLogicData {
  id: string;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  currentWins: number;
  currentLosses: number;
  slTpMode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTradeLogic() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [totalTrades, setTotalTrades] = useState(10);
  const [winTrades, setWinTrades] = useState(7);
  const [slTpMode, setSlTpMode] = useState("admin_override");
  const [active, setActive] = useState(true);

  const { data: logic, isLoading } = useQuery<GlobalTradeLogicData>({
    queryKey: ["/api/admin/global-trade-logic"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { totalTrades: number; winTrades: number; lossTrades: number; slTpMode: string; active: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/global-trade-logic", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-trade-logic"] });
      setIsEditing(false);
      toast({ title: "Trade Logic Updated", description: "Global configuration has been saved." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/global-trade-logic/reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-trade-logic"] });
      toast({ title: "Counters Reset", description: "Win/loss counters have been reset to zero." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to reset", variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (logic) {
      setTotalTrades(logic.totalTrades);
      setWinTrades(logic.winTrades);
      setSlTpMode(logic.slTpMode);
      setActive(logic.active);
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    const lossTrades = totalTrades - winTrades;
    if (winTrades < 0 || winTrades > totalTrades) {
      toast({ title: "Error", description: "Win trades must be between 0 and total trades.", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ totalTrades, winTrades, lossTrades, slTpMode, active });
  };

  const completedTrades = (logic?.currentWins || 0) + (logic?.currentLosses || 0);
  const progress = logic && logic.totalTrades > 0 ? (completedTrades / logic.totalTrades) * 100 : 0;
  const winRate = logic && logic.totalTrades > 0 ? ((logic.winTrades / logic.totalTrades) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-trade-logic-title">
            <Brain className="w-6 h-6 text-primary" />
            Global Trade Logic
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure win/loss outcomes that apply to all users' trading sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending} data-testid="button-reset-counters">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Counters
              </Button>
              <Button onClick={startEditing} data-testid="button-edit-logic">
                <Settings2 className="w-4 h-4 mr-2" />
                Edit Configuration
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : isEditing ? (
        <Card className="p-6" data-testid="card-edit-form">
          <h3 className="text-lg font-semibold mb-4">Edit Global Trade Logic</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">Enable or disable trade logic globally</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} data-testid="switch-active" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Total Trades in Cycle</Label>
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
                <Label className="text-sm font-medium mb-1.5 block">Win Trades</Label>
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
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">SL/TP Mode</Label>
              <Select value={slTpMode} onValueChange={setSlTpMode}>
                <SelectTrigger data-testid="select-sl-tp-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_override">Admin Override</SelectItem>
                  <SelectItem value="natural_priority">Natural Priority</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                {slTpMode === "admin_override"
                  ? "Admin's win/loss logic takes priority over user's SL/TP settings."
                  : "User's SL/TP are honored first; trade logic applies only when SL/TP don't trigger."}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Preview</div>
              <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-logic">
                {saveMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card className="p-6" data-testid="card-status-overview">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Status</h3>
              <Badge variant={logic?.active ? "default" : "secondary"} data-testid="badge-active-status">
                {logic?.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {!logic?.active && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">Trade logic is currently disabled. Trades will execute without win/loss override.</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <Trophy className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-500" data-testid="text-win-trades">{logic?.winTrades || 0}</div>
                <div className="text-xs text-muted-foreground">Win Trades</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-500" data-testid="text-loss-trades">{logic?.lossTrades || 0}</div>
                <div className="text-xs text-muted-foreground">Loss Trades</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <Target className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-bold" data-testid="text-total-trades">{logic?.totalTrades || 0}</div>
                <div className="text-xs text-muted-foreground">Total Cycle</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <div className="text-2xl font-bold" data-testid="text-win-rate">{winRate}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-sl-tp-mode">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">SL/TP Mode</h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm px-3 py-1" data-testid="badge-sl-tp-mode">
                {logic?.slTpMode === "admin_override" ? "Admin Override" : "Natural Priority"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {logic?.slTpMode === "admin_override"
                  ? "Admin's win/loss logic overrides user's SL/TP settings."
                  : "User's SL/TP are honored first; trade logic applies when SL/TP don't trigger."}
              </p>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-cycle-progress">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Cycle Progress</h3>
              <span className="text-sm text-muted-foreground" data-testid="text-progress-count">
                {completedTrades} / {logic?.totalTrades || 0} trades
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, progress)}%`,
                  background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${logic && logic.totalTrades > 0 ? (logic.currentWins / completedTrades * 100) || 0 : 0}%, #ef4444 ${logic && logic.totalTrades > 0 ? (logic.currentWins / completedTrades * 100) || 0 : 0}%, #ef4444 100%)`,
                }}
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">
                  Wins: <span className="font-semibold text-foreground" data-testid="text-current-wins">{logic?.currentWins || 0}</span> / {logic?.winTrades || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">
                  Losses: <span className="font-semibold text-foreground" data-testid="text-current-losses">{logic?.currentLosses || 0}</span> / {logic?.lossTrades || 0}
                </span>
              </div>
            </div>
            {progress >= 100 && (
              <div className="mt-3 p-2 bg-primary/10 rounded-lg text-center text-sm text-primary">
                Cycle complete — counters will auto-reset on next trade.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
