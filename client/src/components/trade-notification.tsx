import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Info, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "success" | "error" | "info" | "position_opened" | "position_closed";

interface TradeNotification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  pnl?: number;
  direction?: "buy" | "sell";
}

interface TradeNotificationPopupProps {
  notification: TradeNotification;
  onDismiss: (id: string) => void;
}

function TradeNotificationPopup({ notification, onDismiss }: TradeNotificationPopupProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("visible"), 50);
    const exitTimer = setTimeout(() => setPhase("exit"), 2500);
    const removeTimer = setTimeout(() => onDismiss(notification.id), 3000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onDismiss]);

  const icon = (() => {
    switch (notification.type) {
      case "success":
      case "position_opened":
        return <CheckCircle2 className="w-6 h-6" />;
      case "error":
        return <XCircle className="w-6 h-6" />;
      case "position_closed":
        return notification.pnl !== undefined && notification.pnl >= 0
          ? <TrendingUp className="w-6 h-6" />
          : <TrendingDown className="w-6 h-6" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  })();

  const colorScheme = (() => {
    switch (notification.type) {
      case "success":
      case "position_opened":
        return {
          border: "border-emerald-500/40",
          iconBg: "bg-emerald-500/20",
          iconColor: "text-emerald-400",
          glow: "shadow-emerald-500/20",
          accent: "from-emerald-500/10 via-transparent to-transparent",
          bar: "bg-emerald-500",
        };
      case "error":
        return {
          border: "border-red-500/40",
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          glow: "shadow-red-500/20",
          accent: "from-red-500/10 via-transparent to-transparent",
          bar: "bg-red-500",
        };
      case "position_closed":
        if (notification.pnl !== undefined && notification.pnl >= 0) {
          return {
            border: "border-emerald-500/40",
            iconBg: "bg-emerald-500/20",
            iconColor: "text-emerald-400",
            glow: "shadow-emerald-500/20",
            accent: "from-emerald-500/10 via-transparent to-transparent",
            bar: "bg-emerald-500",
          };
        }
        return {
          border: "border-orange-500/40",
          iconBg: "bg-orange-500/20",
          iconColor: "text-orange-400",
          glow: "shadow-orange-500/20",
          accent: "from-orange-500/10 via-transparent to-transparent",
          bar: "bg-orange-500",
        };
      default:
        return {
          border: "border-blue-500/40",
          iconBg: "bg-blue-500/20",
          iconColor: "text-blue-400",
          glow: "shadow-blue-500/20",
          accent: "from-blue-500/10 via-transparent to-transparent",
          bar: "bg-blue-500",
        };
    }
  })();

  return (
    <div
      data-testid="trade-notification"
      className={cn(
        "pointer-events-auto w-[360px] max-w-[90vw] rounded-xl border backdrop-blur-xl transition-all duration-500 ease-out overflow-hidden",
        "bg-[#1a1a2e]/90",
        colorScheme.border,
        `shadow-lg ${colorScheme.glow}`,
        phase === "enter" && "opacity-0 scale-90 translate-y-4",
        phase === "visible" && "opacity-100 scale-100 translate-y-0",
        phase === "exit" && "opacity-0 scale-95 -translate-y-2",
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", colorScheme.accent)} />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", colorScheme.iconBg, colorScheme.iconColor)}>
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white tracking-wide">{notification.title}</h4>
              <button
                onClick={() => { setPhase("exit"); setTimeout(() => onDismiss(notification.id), 300); }}
                className="flex-shrink-0 text-white/30 opacity-70 hover:opacity-100 transition-opacity"
                data-testid="button-dismiss-notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {notification.description && (
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{notification.description}</p>
            )}
            {notification.pnl !== undefined && (
              <div className={cn("mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold", notification.pnl >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                {notification.pnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                P&L: {notification.pnl >= 0 ? "+" : ""}{notification.pnl.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-[3px] bg-white/5">
        <div
          className={cn("h-full rounded-full", colorScheme.bar)}
          style={{
            width: phase === "exit" ? "0%" : phase === "enter" ? "100%" : "0%",
            transition: phase === "visible" ? "width 2.5s linear" : "none",
          }}
        />
      </div>
    </div>
  );
}

let notifyFn: ((n: Omit<TradeNotification, "id">) => void) | null = null;

export function useTradeNotification() {
  const notify = useCallback((n: Omit<TradeNotification, "id">) => {
    if (notifyFn) notifyFn(n);
  }, []);
  return notify;
}

export function TradeNotificationContainer() {
  const [notifications, setNotifications] = useState<TradeNotification[]>([]);

  const addNotification = useCallback((n: Omit<TradeNotification, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => [...prev.slice(-4), { ...n, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    notifyFn = addNotification;
    return () => { notifyFn = null; };
  }, [addNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-start pt-20 gap-3" data-testid="notification-container">
      {notifications.map((n) => (
        <TradeNotificationPopup key={n.id} notification={n} onDismiss={removeNotification} />
      ))}
    </div>
  );
}
