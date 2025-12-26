import { 
  Wallet, 
  History, 
  LayoutDashboard, 
  MessageCircle, 
  Trophy, 
  MoreHorizontal,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = "portfolio" | "history" | "dashboard" | "support" | "leaderboard" | "more";

interface TradeRoomSidebarProps {
  activeItem: NavItem;
  onItemClick: (item: NavItem) => void;
  onLogout: () => void;
  className?: string;
}

const navItems: { id: NavItem; label: string; icon: typeof Wallet }[] = [
  { id: "portfolio", label: "Total Portfolio", icon: Wallet },
  { id: "history", label: "Trading History", icon: History },
  { id: "dashboard", label: "Performance Dashboard", icon: LayoutDashboard },
  { id: "support", label: "Chats & Support", icon: MessageCircle },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export function TradeRoomSidebar({ activeItem, onItemClick, onLogout, className }: TradeRoomSidebarProps) {
  return (
    <aside className={cn(
      "hidden md:flex flex-col w-16 bg-black/40 border-r border-white/5",
      className
    )}>
      <nav className="flex-1 flex flex-col items-center py-4 gap-1">
        {navItems.map((item) => (
          <Tooltip key={item.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onItemClick(item.id)}
                data-testid={`sidebar-${item.id}`}
                className={cn(
                  "w-12 h-12 rounded-lg",
                  activeItem === item.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-black border-white/10">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
      
      <div className="flex flex-col items-center py-4 gap-1 border-t border-white/5">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              data-testid="sidebar-logout"
              className="w-12 h-12 rounded-lg text-muted-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black border-white/10">
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

export function MobileBottomNav({ activeItem, onItemClick }: { activeItem: NavItem; onItemClick: (item: NavItem) => void }) {
  const mobileItems = navItems.slice(0, 5);
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/10 backdrop-blur-xl">
      <div className="flex justify-around items-center h-16 px-2">
        {mobileItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            data-testid={`mobile-nav-${item.id}`}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              activeItem === item.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
