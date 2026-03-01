import { useLocation } from "wouter";
import { BarChart3, Wallet, History, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "trade", icon: BarChart3, label: "Trade", route: "/" },
  { id: "portfolio", icon: Wallet, label: "Portfolio", route: "/portfolio" },
  { id: "history", icon: History, label: "History", route: "/history" },
  { id: "support", icon: MessageCircle, label: "Support", route: "/support" },
  { id: "more", icon: Settings, label: "More", route: "/more" },
];

export function MobileBottomNav({ activeTab }: { activeTab?: string }) {
  const [location, setLocation] = useLocation();

  const currentTab = activeTab || navItems.find(item => {
    if (item.route === "/") return location === "/" || location === "/trade";
    return location.startsWith(item.route);
  })?.id || "trade";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 glass-dark py-2 px-2" data-testid="mobile-bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setLocation(item.route)}
          data-testid={`mobile-nav-${item.id}`}
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all min-w-0",
            currentTab === item.id
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] truncate">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
