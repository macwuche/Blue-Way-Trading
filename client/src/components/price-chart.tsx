import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { generatePriceHistory, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  className?: string;
}

type TimeRange = "1H" | "4H" | "1D" | "1W" | "1M" | "1Y";

const timeRanges: TimeRange[] = ["1H", "4H", "1D", "1W", "1M", "1Y"];

export function PriceChart({ symbol, currentPrice, changePercent, className }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1D");

  const chartData = useMemo(() => {
    const pointsMap: Record<TimeRange, number> = {
      "1H": 12,
      "4H": 24,
      "1D": 24,
      "1W": 7,
      "1M": 30,
      "1Y": 12,
    };
    const points = pointsMap[selectedRange];
    const history = generatePriceHistory(currentPrice, points);
    
    return history.map((price, index) => ({
      time: index,
      price: price,
    }));
  }, [currentPrice, selectedRange, symbol]);

  const isPositive = changePercent >= 0;
  const gradientId = `gradient-${symbol.replace(/[^a-zA-Z]/g, "")}`;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              data-testid={`button-range-${range}`}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                selectedRange === range
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover-elevate"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "hsl(145, 80%, 42%)" : "hsl(4, 90%, 58%)"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "hsl(145, 80%, 42%)" : "hsl(4, 90%, 58%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass rounded-md px-3 py-2 text-sm">
                      <span className="font-mono font-semibold">
                        ${formatPrice(payload[0].value as number)}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "hsl(145, 80%, 42%)" : "hsl(4, 90%, 58%)"}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MiniChart({ 
  data, 
  isPositive, 
  height = 40 
}: { 
  data: number[]; 
  isPositive: boolean; 
  height?: number;
}) {
  const chartData = data.map((price, index) => ({ time: index, price }));
  const gradientId = `mini-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width: "80px", height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? "hsl(145, 80%, 42%)" : "hsl(4, 90%, 58%)"}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={isPositive ? "hsl(145, 80%, 42%)" : "hsl(4, 90%, 58%)"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "hsl(145, 80%, 42%)" : "hsl(4, 90%, 58%)"}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            animationDuration={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
