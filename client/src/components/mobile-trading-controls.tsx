import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Asset } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface MobileTradingControlsProps {
  asset: Asset | null;
  balance: number;
  onTrade: (data: { type: "buy" | "sell"; quantity: number; price: number }) => void;
  isLoading?: boolean;
}

const expirationOptions = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
];

export function MobileTradingControls({ 
  asset, 
  balance, 
  onTrade, 
  isLoading 
}: MobileTradingControlsProps) {
  const [expirationIndex, setExpirationIndex] = useState(0);
  const [amount, setAmount] = useState(1);
  const [profit, setProfit] = useState(86);
  const [higherPercent, setHigherPercent] = useState(47);
  
  const expiration = expirationOptions[expirationIndex];
  const lowerPercent = 100 - higherPercent;
  
  useEffect(() => {
    setProfit(Math.floor(80 + Math.random() * 12));
    const newPercent = 40 + Math.floor(Math.random() * 20);
    setHigherPercent(newPercent);
  }, [asset, expirationIndex]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHigherPercent(prev => {
        const change = (Math.random() - 0.5) * 4;
        return Math.max(20, Math.min(80, prev + change));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const profitAmount = (amount * profit) / 100;
  
  const handlePrevExpiration = () => {
    setExpirationIndex(prev => (prev === 0 ? expirationOptions.length - 1 : prev - 1));
  };
  
  const handleNextExpiration = () => {
    setExpirationIndex(prev => (prev === expirationOptions.length - 1 ? 0 : prev + 1));
  };
  
  const handleHigher = () => {
    if (!asset || isLoading) return;
    onTrade({ type: "buy", quantity: amount, price: asset.price });
  };
  
  const handleLower = () => {
    if (!asset || isLoading) return;
    onTrade({ type: "sell", quantity: amount, price: asset.price });
  };
  
  return (
    <div className="bg-[#1c1c1e]/95 border-t border-white/10 backdrop-blur-xl">
      <div className="h-1.5 flex">
        <div 
          className="bg-destructive transition-all duration-500" 
          style={{ width: `${lowerPercent}%` }}
        />
        <div 
          className="bg-success transition-all duration-500" 
          style={{ width: `${higherPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] px-2 py-0.5 text-muted-foreground">
        <span className="text-destructive">{Math.round(lowerPercent)}%</span>
        <span className="text-success">{Math.round(higherPercent)}%</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 p-3">
        <div>
          <div className="text-[10px] text-muted-foreground text-center mb-1">Time</div>
          <div className="flex items-center justify-between bg-white/5 rounded-lg h-11">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePrevExpiration}
              data-testid="mobile-time-prev"
              className="w-10 h-full rounded-l-lg rounded-r-none shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-base font-bold flex-1 text-center">{expiration.label}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNextExpiration}
              data-testid="mobile-time-next"
              className="w-10 h-full rounded-r-lg rounded-l-none shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <div className="text-[10px] text-muted-foreground text-center mb-1">Amount ($)</div>
          <div className="flex items-center justify-between bg-white/5 rounded-lg h-11">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAmount(Math.max(1, amount - 1))}
              data-testid="mobile-amount-decrease"
              className="w-10 h-full rounded-l-lg rounded-r-none shrink-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-base font-bold flex-1 text-center">{amount}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAmount(Math.min(balance, amount + 1))}
              data-testid="mobile-amount-increase"
              className="w-10 h-full rounded-r-lg rounded-l-none shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 px-3">
        <Button
          onClick={handleLower}
          disabled={isLoading || !asset}
          data-testid="mobile-button-lower"
          className="h-12 bg-destructive hover:bg-destructive/90 text-white font-bold text-base rounded-lg flex items-center justify-center gap-2"
        >
          <span>Lower</span>
          <TrendingDown className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleHigher}
          disabled={isLoading || !asset}
          data-testid="mobile-button-higher"
          className="h-12 bg-success hover:bg-success/90 text-white font-bold text-base rounded-lg flex items-center justify-center gap-2"
        >
          <span>Higher</span>
          <TrendingUp className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="text-center text-sm text-muted-foreground py-2">
        Expected return{" "}
        <span className="text-success font-medium">+${profitAmount.toFixed(2)}</span>{" "}
        <span className="text-success font-medium">+{profit}%</span>
      </div>
    </div>
  );
}
