import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, AlertTriangle, XOctagon, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

function getNotifIcon(type: string) {
  switch (type) {
    case "success": return <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />;
    case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />;
    case "error": return <XOctagon className="w-5 h-5 text-red-400 shrink-0" />;
    default: return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
  }
}

export function GlobalNotificationPopup() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [popupNotification, setPopupNotification] = useState<NotificationItem | null>(null);
  const shownInitialPopup = useRef(false);

  const isAdminPage = location.startsWith("/admin");

  const { data: notifData } = useQuery<{ notifications: NotificationItem[]; unreadCount: number }>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
    enabled: !!user && !isAdminPage,
  });

  useEffect(() => {
    if (!user || isAdminPage) return;

    const eventSource = new EventSource("/api/user/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "portfolio_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        }
        if (data.type === "notification") {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          setPopupNotification(data.notification);
        }
      } catch {
      }
    };

    eventSource.onerror = () => {
    };

    return () => {
      eventSource.close();
    };
  }, [user, isAdminPage]);

  useEffect(() => {
    if (notifData && notifData.unreadCount > 0 && !shownInitialPopup.current && !popupNotification) {
      const latestUnread = notifData.notifications.find(n => !n.read);
      if (latestUnread) {
        const lastShownId = localStorage.getItem("lastShownNotifId");
        if (lastShownId !== latestUnread.id) {
          shownInitialPopup.current = true;
          localStorage.setItem("lastShownNotifId", latestUnread.id);
          setPopupNotification(latestUnread);
        }
      }
    }
  }, [notifData]);

  if (!popupNotification || isAdminPage) return null;

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-md rounded-xl border border-white/10 shadow-2xl p-4 animate-in slide-in-from-top-full duration-300",
        "bg-gradient-to-br from-[#1a1f35]/95 to-[#0d1225]/95 backdrop-blur-xl",
        popupNotification.type === "success" ? "border-l-4 border-l-green-400" :
        popupNotification.type === "warning" ? "border-l-4 border-l-yellow-400" :
        popupNotification.type === "error" ? "border-l-4 border-l-red-400" :
        "border-l-4 border-l-blue-400"
      )}
      data-testid="popup-notification"
    >
      <div className="flex items-start gap-3">
        {getNotifIcon(popupNotification.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{popupNotification.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{popupNotification.message}</p>
        </div>
        <button
          onClick={() => setPopupNotification(null)}
          className="text-muted-foreground hover:text-white transition-colors shrink-0"
          data-testid="button-close-popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
