import { Star, Plus, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssetRow } from "./asset-row";
import { type Asset } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface WatchlistProps {
  items: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onRemove?: (symbol: string) => void;
  onAddClick?: () => void;
  maxHeight?: string;
}

export function Watchlist({ items, onSelectAsset, onRemove, onAddClick, maxHeight = "400px" }: WatchlistProps) {
  return (
    <GlassCard className="p-6" gradient>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-chart-5/20">
            <Star className="w-5 h-5 text-chart-5" />
          </div>
          <h3 className="text-lg font-semibold">Watchlist</h3>
        </div>
        {onAddClick && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onAddClick}
            data-testid="button-add-to-watchlist"
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Star className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No watchlist items</p>
          <p className="text-sm text-center">Add assets to track their prices</p>
          {onAddClick && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={onAddClick}
              data-testid="button-add-first-watchlist"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }} className="pr-2">
          <div className="space-y-1">
            {items.map((asset) => (
              <div key={asset.symbol} className="relative group">
                <AssetRow
                  asset={asset}
                  onClick={() => onSelectAsset(asset)}
                  showChart
                />
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(asset.symbol);
                    }}
                    data-testid={`button-remove-watchlist-${asset.symbol}`}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full",
                      "bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-200 hover:bg-destructive/30"
                    )}
                    style={{ visibility: "hidden" }}
                    onMouseEnter={(e) => (e.currentTarget.style.visibility = "visible")}
                    onMouseLeave={(e) => (e.currentTarget.style.visibility = "hidden")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </GlassCard>
  );
}
