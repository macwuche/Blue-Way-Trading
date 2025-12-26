import { 
  Wallet, 
  History, 
  LayoutDashboard, 
  MessageCircle, 
  Trophy, 
  MoreHorizontal,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar
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

interface MobileBottomNavProps {
  activeItem: NavItem;
  onItemClick: (item: NavItem) => void;
  onAddAsset?: () => void;
}

export function MobileBottomNav({ activeItem, onItemClick, onAddAsset }: MobileBottomNavProps) {
  const today = new Date().getDate();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e]/95 border-t border-white/10 backdrop-blur-xl">
      <div className="flex justify-between items-center h-12 px-6 gap-4">
        <button
          onClick={() => window.history.back()}
          data-testid="mobile-nav-back"
          className="p-2 text-muted-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => window.history.forward()}
          data-testid="mobile-nav-forward"
          className="p-2 text-muted-foreground"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        <button
          onClick={onAddAsset}
          data-testid="mobile-nav-add"
          className="w-10 h-10 rounded-full bg-[#3a3a3c] flex items-center justify-center text-muted-foreground"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onItemClick("history")}
          data-testid="mobile-nav-calendar"
          className="p-2 text-muted-foreground relative"
        >
          <Calendar className="w-6 h-6" />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">{today}</span>
        </button>
        
        <button
          onClick={() => onItemClick("more")}
          data-testid="mobile-nav-more"
          className="p-2 text-muted-foreground"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
