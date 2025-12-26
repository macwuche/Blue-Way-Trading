import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { type Asset, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface BinaryTradingPanelProps {
  asset: Asset | null;
  balance: number;
  onTrade: (data: { type: "buy" | "sell"; quantity: number; price: number }) => void;
  isLoading?: boolean;
  className?: string;
}

const expirationOptions = [
  { label: "30 sec", value: 30 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "15 min", value: 900 },
];

const amountPresets = [1, 5, 10, 25, 50, 100];

export function BinaryTradingPanel({ 
  asset, 
  balance, 
  onTrade, 
  isLoading,
  className 
}: BinaryTradingPanelProps) {
  const [expiration, setExpiration] = useState(30);
  const [amount, setAmount] = useState(1);
  const [profit, setProfit] = useState(87);
  
  useEffect(() => {
    setProfit(Math.floor(80 + Math.random() * 12));
  }, [asset, expiration]);
  
  const profitAmount = (amount * profit) / 100;
  
  const handleHigher = () => {
    if (!asset || isLoading) return;
    onTrade({ type: "buy", quantity: amount, price: asset.price });
  };
  
  const handleLower = () => {
    if (!asset || isLoading) return;
    onTrade({ type: "sell", quantity: amount, price: asset.price });
  };
  
  return (
    <div className={cn(
      "flex flex-col bg-black/40 border-l border-white/5 w-full md:w-[200px] shrink-0",
      className
    )}>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center justify-between mb-2">
            Expiration
            <span className="text-white font-medium">{expirationOptions.find(e => e.value === expiration)?.label}</span>
          </label>
          <div className="grid grid-cols-2 gap-1">
            {expirationOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setExpiration(opt.value)}
                data-testid={`expiration-${opt.value}`}
                className={cn(
                  "px-2 py-1.5 text-xs rounded-md transition-all",
                  expiration === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-muted-foreground hover-elevate"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2 block">
            Amount
          </label>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAmount(Math.max(1, amount - 1))}
              data-testid="amount-decrease"
              className="w-8 h-8 shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold">${amount}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAmount(Math.min(balance, amount + 1))}
              data-testid="amount-increase"
              className="w-8 h-8 shrink-0"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {amountPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(Math.min(balance, preset))}
                data-testid={`amount-preset-${preset}`}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-all",
                  amount === preset
                    ? "bg-primary/20 text-primary"
                    : "bg-white/5 text-muted-foreground hover-elevate"
                )}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Profit</span>
            <span className="text-white/50">up to</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-success">+{profit}%</span>
          </div>
          <div className="text-success text-sm font-medium mt-1">
            +${profitAmount.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-4 space-y-2">
        <Button
          onClick={handleHigher}
          disabled={isLoading || !asset}
          data-testid="button-higher"
          className="w-full h-16 bg-success hover:bg-success/90 text-white font-bold text-lg rounded-lg flex flex-col items-center justify-center gap-0.5"
        >
          <TrendingUp className="w-6 h-6" />
          <span>HIGHER</span>
        </Button>
        
        <Button
          onClick={handleLower}
          disabled={isLoading || !asset}
          data-testid="button-lower"
          className="w-full h-16 bg-destructive hover:bg-destructive/90 text-white font-bold text-lg rounded-lg flex flex-col items-center justify-center gap-0.5"
        >
          <TrendingDown className="w-6 h-6" />
          <span>LOWER</span>
        </Button>
      </div>
    </div>
  );
}

interface TradingInfoPanelProps {
  asset: Asset | null;
  className?: string;
}

export function TradingInfoPanel({ asset, className }: TradingInfoPanelProps) {
  const [higherPercent, setHigherPercent] = useState(50);
  const [selectedTime, setSelectedTime] = useState("5m");
  
  useEffect(() => {
    if (!asset) return;
    const newPercent = 40 + Math.floor(Math.random() * 20);
    setHigherPercent(newPercent);
    
    const interval = setInterval(() => {
      setHigherPercent(prev => {
        const change = (Math.random() - 0.5) * 4;
        return Math.max(20, Math.min(80, prev + change));
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [asset]);
  
  const lowerPercent = 100 - higherPercent;
  
  const timeOptions = ["1m", "5m", "15m", "1h", "3h"];
  
  if (!asset) return null;
  
  return (
    <div className={cn(
      "hidden lg:flex flex-col w-[100px] bg-black/40 border-r border-white/5 p-3",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <X className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-white" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[8px] font-bold text-white">
            {asset.symbol.slice(0, 2)}
          </div>
          <span className="text-xs font-medium">{asset.symbol}</span>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-[10px] text-muted-foreground">HIGHER</span>
          </div>
          <div className="text-lg font-bold text-success">{Math.round(higherPercent)}%</div>
        </div>
        
        <div className="h-24 w-2 bg-white/10 rounded-full mx-auto relative overflow-hidden">
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-destructive to-success rounded-full transition-all duration-500"
            style={{ height: `${higherPercent}%` }}
          />
        </div>
        
        <div>
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-muted-foreground">LOWER</span>
          </div>
          <div className="text-lg font-bold text-destructive">{Math.round(lowerPercent)}%</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="grid grid-cols-1 gap-1">
          {timeOptions.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              data-testid={`time-${time}`}
              className={cn(
                "px-2 py-1.5 text-xs rounded transition-all",
                selectedTime === time
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover-elevate"
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 text-[10px] space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>ask</span>
          <span className="text-white font-mono">{formatPrice(asset.price * 1.0002)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>bid</span>
          <span className="text-white font-mono">{formatPrice(asset.price * 0.9998)}</span>
        </div>
      </div>
    </div>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
