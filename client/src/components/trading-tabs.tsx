import { useState } from "react";
import { Plus, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { type Asset, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface TradingTab {
  asset: Asset;
  id: string;
}

interface TradingTabsProps {
  tabs: TradingTab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
  balance: number;
  className?: string;
}

function getAssetBadgeVariant(type: Asset["type"]) {
  switch (type) {
    case "crypto":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "forex":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "stock":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "etf":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default:
      return "";
  }
}

function getAssetTypeLabel(type: Asset["type"]) {
  switch (type) {
    case "crypto":
      return "Blitz";
    case "forex":
      return "Binary";
    case "stock":
      return "Stock";
    case "etf":
      return "ETF";
    default:
      return type;
  }
}

export function TradingTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onAddTab,
  balance,
  className,
}: TradingTabsProps) {
  return (
    <header className={cn(
      "flex items-center h-14 bg-black/60 border-b border-white/5 backdrop-blur-xl",
      className
    )}>
      <ScrollArea className="flex-1">
        <div className="flex items-center h-14 px-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              data-testid={`tab-${tab.asset.symbol}`}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-lg transition-all min-w-[140px] text-left",
                activeTabId === tab.id
                  ? "bg-primary/20 border border-primary/30"
                  : "bg-white/5 border border-transparent hover-elevate"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {tab.asset.symbol.slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{tab.asset.symbol}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded w-fit",
                  getAssetBadgeVariant(tab.asset.type)
                )}>
                  {getAssetTypeLabel(tab.asset.type)}
                </span>
              </div>
              {tabs.length > 1 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }
                  }}
                  data-testid={`close-tab-${tab.asset.symbol}`}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded hover:bg-white/10 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddTab}
            data-testid="button-add-tab"
            className="shrink-0 w-10 h-10 rounded-lg border border-dashed border-white/20 text-muted-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
      
      <div className="flex items-center gap-3 px-4 border-l border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">U</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Practice Account</div>
            <div className="text-lg font-bold text-success">${formatPrice(balance)}</div>
          </div>
        </div>
        <Button
          size="sm"
          data-testid="button-deposit"
          className="bg-success hover:bg-success/90 text-white font-semibold hidden sm:flex"
        >
          Deposit
        </Button>
      </div>
    </header>
  );
}
