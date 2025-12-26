import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { GlassCard } from "@/components/ui/glass-card";
import { type Asset, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface TradingPanelProps {
  asset: Asset | null;
  balance: number;
  onExecuteTrade: (data: { type: "buy" | "sell"; quantity: number; price: number }) => void;
  isLoading?: boolean;
}

export function TradingPanel({ asset, balance, onExecuteTrade, isLoading }: TradingPanelProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);

  if (!asset) {
    return (
      <GlassCard className="p-6" gradient>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ArrowUpRight className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Select an asset</p>
          <p className="text-sm text-center">Choose a market to start trading</p>
        </div>
      </GlassCard>
    );
  }

  const quantity = parseFloat(amount) || 0;
  const total = quantity * asset.price;
  const maxBuyAmount = balance / asset.price;
  
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const percentage = value[0] / 100;
    const maxAmount = tradeType === "buy" ? maxBuyAmount : 100;
    setAmount((maxAmount * percentage).toFixed(asset.type === "crypto" ? 6 : 2));
  };

  const handleExecute = () => {
    if (quantity > 0) {
      onExecuteTrade({
        type: tradeType,
        quantity,
        price: asset.price,
      });
      setAmount("");
      setSliderValue([0]);
    }
  };

  const isValidTrade = quantity > 0 && (tradeType === "buy" ? total <= balance : true);

  return (
    <GlassCard className="p-6" gradient>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">{asset.symbol}</h3>
          <p className="text-2xl font-bold font-mono">${formatPrice(asset.price)}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
          asset.changePercent24h >= 0 
            ? "bg-success/20 text-success" 
            : "bg-destructive/20 text-destructive"
        )}>
          {asset.changePercent24h >= 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {asset.changePercent24h >= 0 ? "+" : ""}{asset.changePercent24h.toFixed(2)}%
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTradeType("buy")}
          data-testid="button-buy-toggle"
          className={cn(
            "flex-1 py-3 rounded-lg font-semibold transition-all duration-200",
            tradeType === "buy"
              ? "bg-success text-white"
              : "glass-light text-muted-foreground"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeType("sell")}
          data-testid="button-sell-toggle"
          className={cn(
            "flex-1 py-3 rounded-lg font-semibold transition-all duration-200",
            tradeType === "sell"
              ? "bg-destructive text-white"
              : "glass-light text-muted-foreground"
          )}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Amount ({asset.symbol})
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              const val = parseFloat(e.target.value) || 0;
              const max = tradeType === "buy" ? maxBuyAmount : 100;
              setSliderValue([Math.min((val / max) * 100, 100)]);
            }}
            data-testid="input-trade-amount"
            className="glass-light border-border/30 text-lg font-mono"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-3">
            <span>Percentage</span>
            <span>{sliderValue[0].toFixed(0)}%</span>
          </div>
          <Slider
            value={sliderValue}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
            data-testid="slider-trade-percentage"
            className="[&>span:first-child]:bg-muted [&>span:first-child>span]:bg-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="glass-light rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono">${formatPrice(asset.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-mono">{quantity.toFixed(asset.type === "crypto" ? 6 : 2)}</span>
          </div>
          <div className="border-t border-border/30 my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="font-mono">${formatPrice(total)}</span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Available Balance: <span className="font-mono text-foreground">${formatPrice(balance)}</span>
        </div>

        <Button
          onClick={handleExecute}
          disabled={!isValidTrade || isLoading}
          data-testid="button-execute-trade"
          className={cn(
            "w-full h-14 text-lg font-semibold transition-all duration-200",
            tradeType === "buy"
              ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              : "bg-destructive hover:bg-destructive/90"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {tradeType === "buy" ? "Buy" : "Sell"} {asset.symbol}
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}
