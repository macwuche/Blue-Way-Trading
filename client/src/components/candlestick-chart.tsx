import { useMemo, useState, useEffect } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Customized,
} from "recharts";
import { formatPrice } from "@/lib/market-data";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  symbol: string;
  currentPrice: number;
  className?: string;
}

function generateCandleData(basePrice: number, count: number = 50): CandleData[] {
  const data: CandleData[] = [];
  let price = basePrice * 0.98;
  const now = new Date();
  
  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    const volatility = basePrice * 0.008;
    const open = price;
    const change = (Math.random() - 0.48) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  if (data.length > 0) {
    data[data.length - 1].close = basePrice;
  }
  
  return data;
}

interface CandlesProps {
  data: CandleData[];
  xAxisMap: any;
  yAxisMap: any;
  offset: any;
}

function Candles({ data, xAxisMap, yAxisMap, offset }: CandlesProps) {
  if (!xAxisMap || !yAxisMap || !data.length) return null;
  
  const xAxis = xAxisMap[0];
  const yAxis = yAxisMap[0];
  
  if (!xAxis || !yAxis) return null;
  
  const { x: xStart, width: xWidth } = offset;
  const { y: yStart, height: yHeight } = offset;
  
  const yScale = yAxis.scale;
  const xScale = xAxis.scale;
  
  if (!yScale || !xScale) return null;
  
  const candleWidth = Math.max(Math.floor((xWidth / data.length) * 0.7), 3);
  
  return (
    <g>
      {data.map((candle, index) => {
        const x = xScale(candle.time);
        if (x === undefined) return null;
        
        const isUp = candle.close >= candle.open;
        const color = isUp ? "#34C759" : "#FF3B30";
        
        const highY = yScale(candle.high);
        const lowY = yScale(candle.low);
        const openY = yScale(candle.open);
        const closeY = yScale(candle.close);
        
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
        
        const candleX = x - candleWidth / 2;
        
        return (
          <g key={index}>
            <line
              x1={x}
              y1={highY}
              x2={x}
              y2={bodyTop}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={x}
              y1={bodyBottom}
              x2={x}
              y2={lowY}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={candleX}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </g>
  );
}

export function CandlestickChart({ symbol, currentPrice, className }: CandlestickChartProps) {
  const [data, setData] = useState<CandleData[]>([]);
  
  useEffect(() => {
    setData(generateCandleData(currentPrice, 50));
    
    const interval = setInterval(() => {
      setData(prev => {
        if (prev.length === 0) return generateCandleData(currentPrice, 50);
        
        const newData = [...prev];
        const lastCandle = newData[newData.length - 1];
        const volatility = currentPrice * 0.002;
        const change = (Math.random() - 0.5) * volatility;
        
        newData[newData.length - 1] = {
          ...lastCandle,
          close: lastCandle.close + change,
          high: Math.max(lastCandle.high, lastCandle.close + change),
          low: Math.min(lastCandle.low, lastCandle.close + change),
        };
        
        return newData;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [symbol, currentPrice]);
  
  const { minPrice, maxPrice } = useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 0 };
    const lows = data.map(d => d.low);
    const highs = data.map(d => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.1;
    return { minPrice: min - padding, maxPrice: max + padding };
  }, [data]);
  
  const latestPrice = data.length > 0 ? data[data.length - 1].close : currentPrice;
  
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 60, left: 10, bottom: 20 }}>
          <XAxis 
            dataKey="time" 
            axisLine={{ stroke: "#3A3A3C" }}
            tickLine={{ stroke: "#3A3A3C" }}
            tick={{ fill: "#8E8E93", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            orientation="right"
            axisLine={{ stroke: "#3A3A3C" }}
            tickLine={{ stroke: "#3A3A3C" }}
            tick={{ fill: "#8E8E93", fontSize: 11 }}
            tickFormatter={(value) => formatPrice(value)}
            width={55}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length && payload[0].payload) {
                const d = payload[0].payload as CandleData;
                return (
                  <div className="bg-black/90 border border-white/10 rounded-md px-3 py-2 text-xs">
                    <div className="text-muted-foreground mb-1">{d.time}</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <span className="text-muted-foreground">O:</span>
                      <span className="font-mono">{formatPrice(d.open)}</span>
                      <span className="text-muted-foreground">H:</span>
                      <span className="font-mono text-success">{formatPrice(d.high)}</span>
                      <span className="text-muted-foreground">L:</span>
                      <span className="font-mono text-destructive">{formatPrice(d.low)}</span>
                      <span className="text-muted-foreground">C:</span>
                      <span className={`font-mono ${d.close >= d.open ? "text-success" : "text-destructive"}`}>
                        {formatPrice(d.close)}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine 
            y={latestPrice} 
            stroke="#007AFF" 
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Customized
            component={(props: any) => (
              <Candles 
                data={data} 
                xAxisMap={props.xAxisMap} 
                yAxisMap={props.yAxisMap}
                offset={props.offset}
              />
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-2 py-1 text-xs font-mono rounded-l-md"
        style={{ marginRight: "5px" }}
      >
        {formatPrice(latestPrice)}
      </div>
    </div>
  );
}
