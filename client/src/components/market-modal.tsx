import { useState, useMemo } from "react";
import { Search, X, Bitcoin, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssetRow } from "./asset-row";
import { type Asset } from "@/lib/market-data";
import { useMarketData } from "@/hooks/use-market-data";
import { cn } from "@/lib/utils";

interface MarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAsset: (asset: Asset) => void;
}

type AssetCategory = "all" | "crypto" | "forex" | "stocks" | "etfs";

const categories: { id: AssetCategory; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "crypto", label: "Crypto", icon: <Bitcoin className="w-4 h-4" /> },
  { id: "forex", label: "Forex", icon: <DollarSign className="w-4 h-4" /> },
  { id: "stocks", label: "Stocks", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "etfs", label: "ETFs", icon: <BarChart3 className="w-4 h-4" /> },
];

export function MarketModal({ open, onOpenChange, onSelectAsset }: MarketModalProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AssetCategory>("all");
  const { cryptoAssets, forexAssets, stockAssets, etfAssets } = useMarketData({ refreshInterval: 5000 });

  const filteredAssets = useMemo(() => {
    let assets: Asset[] = [];
    
    switch (category) {
      case "crypto":
        assets = cryptoAssets;
        break;
      case "forex":
        assets = forexAssets;
        break;
      case "stocks":
        assets = stockAssets;
        break;
      case "etfs":
        assets = etfAssets;
        break;
      default:
        assets = [...cryptoAssets, ...forexAssets, ...stockAssets, ...etfAssets];
    }

    if (search) {
      const searchLower = search.toLowerCase();
      assets = assets.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchLower) ||
          asset.name.toLowerCase().includes(searchLower)
      );
    }

    return assets;
  }, [category, search, cryptoAssets, forexAssets, stockAssets, etfAssets]);

  const handleSelect = (asset: Asset) => {
    onSelectAsset(asset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-border/50 p-0 gap-0 animate-slide-up w-full h-full max-h-full max-w-full md:max-w-lg md:h-auto md:max-h-[85vh] md:rounded-lg rounded-none flex flex-col">
        <DialogHeader className="p-4 md:p-6 pb-3 md:pb-4 border-b border-border/30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-lg md:text-xl font-semibold">Select Market</DialogTitle>
            <DialogDescription className="sr-only">
              Choose an asset to trade from the available markets
            </DialogDescription>
            <button
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
              className="p-2 rounded-full hover-elevate text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative mt-3 md:mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-markets"
              className="pl-10 glass-light border-border/30 focus:border-primary/50"
            />
          </div>

          <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                data-testid={`button-category-${cat.id}`}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200",
                  category === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "glass-light text-muted-foreground hover-elevate"
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 md:h-[400px] md:flex-none">
          <div className="p-3 md:p-4 space-y-1">
            {filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No markets found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <AssetRow
                  key={asset.symbol}
                  asset={asset}
                  onClick={() => handleSelect(asset)}
                  showChart={false}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
