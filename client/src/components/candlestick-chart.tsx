import { useEffect, useRef, useMemo } from "react";
import { createChart, CandlestickSeries, LineSeries, type IChartApi, type CandlestickData, type Time, type LineData } from "lightweight-charts";
import { cn } from "@/lib/utils";

export interface IndicatorSettings {
  alligator: boolean;
  movingAverage: boolean;
  ema: boolean;
  maPeriod: number;
  emaPeriod: number;
}

interface CandlestickChartProps {
  symbol: string;
  currentPrice: number;
  isPositive: boolean;
  className?: string;
  indicators?: IndicatorSettings;
}

function generateCandlestickData(basePrice: number, points: number = 50): CandlestickData[] {
  const data: CandlestickData[] = [];
  let price = basePrice * 0.95;
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    const timeString = Math.floor(time.getTime() / 1000) as Time;
    
    const volatility = basePrice * 0.003;
    const open = price;
    const close = price + (Math.random() - 0.48) * volatility * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    
    data.push({
      time: timeString,
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6)),
    });
    
    price = close;
  }
  
  if (data.length > 0) {
    data[data.length - 1].close = basePrice;
  }
  
  return data;
}

function calculateSMA(data: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: parseFloat((sum / period).toFixed(6)),
    });
  }
  return result;
}

function calculateEMA(data: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;
  result.push({
    time: data[period - 1].time,
    value: parseFloat(ema.toFixed(6)),
  });
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: parseFloat(ema.toFixed(6)),
    });
  }
  return result;
}

function calculateSmoothedMA(data: CandlestickData[], period: number, shift: number): LineData[] {
  const result: LineData[] = [];
  
  if (data.length < period + shift) return result;
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += (data[i].high + data[i].low) / 2;
  }
  let smma = sum / period;
  
  const initialShiftedIndex = (period - 1) + shift;
  if (initialShiftedIndex < data.length && initialShiftedIndex >= 0) {
    result.push({
      time: data[initialShiftedIndex].time,
      value: parseFloat(smma.toFixed(6)),
    });
  }
  
  for (let i = period; i < data.length; i++) {
    const median = (data[i].high + data[i].low) / 2;
    smma = (smma * (period - 1) + median) / period;
    
    const shiftedIndex = i + shift;
    if (shiftedIndex < data.length && shiftedIndex >= 0) {
      result.push({
        time: data[shiftedIndex].time,
        value: parseFloat(smma.toFixed(6)),
      });
    }
  }
  return result;
}

interface AlligatorLines {
  jaw: LineData[];
  teeth: LineData[];
  lips: LineData[];
}

function calculateAlligator(data: CandlestickData[]): AlligatorLines {
  return {
    jaw: calculateSmoothedMA(data, 13, 8),
    teeth: calculateSmoothedMA(data, 8, 5),
    lips: calculateSmoothedMA(data, 5, 3),
  };
}

const defaultIndicators: IndicatorSettings = {
  alligator: false,
  movingAverage: false,
  ema: false,
  maPeriod: 20,
  emaPeriod: 12,
};

export function CandlestickChart({ symbol, currentPrice, isPositive, className, indicators = defaultIndicators }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);
  const indicatorSeriesRef = useRef<ReturnType<IChartApi["addSeries"]>[]>([]);

  const chartData = useMemo(() => {
    return generateCandlestickData(currentPrice, 60);
  }, [currentPrice, symbol]);

  const indicatorData = useMemo(() => {
    return {
      sma: calculateSMA(chartData, indicators.maPeriod),
      ema: calculateEMA(chartData, indicators.emaPeriod),
      alligator: calculateAlligator(chartData),
    };
  }, [chartData, indicators.maPeriod, indicators.emaPeriod]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#98989D",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(255, 255, 255, 0.3)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2C2C2E",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.3)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2C2C2E",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34C759",
      downColor: "#FF3B30",
      borderUpColor: "#34C759",
      borderDownColor: "#FF3B30",
      wickUpColor: "#34C759",
      wickDownColor: "#FF3B30",
    });

    candlestickSeries.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData]);

  useEffect(() => {
    if (!chartRef.current) return;

    indicatorSeriesRef.current.forEach(series => {
      try {
        chartRef.current?.removeSeries(series);
      } catch (e) {}
    });
    indicatorSeriesRef.current = [];

    if (indicators.movingAverage && indicatorData.sma.length > 0) {
      const maSeries = chartRef.current.addSeries(LineSeries, {
        color: "#FF9500",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      maSeries.setData(indicatorData.sma);
      indicatorSeriesRef.current.push(maSeries);
    }

    if (indicators.ema && indicatorData.ema.length > 0) {
      const emaSeries = chartRef.current.addSeries(LineSeries, {
        color: "#AF52DE",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      emaSeries.setData(indicatorData.ema);
      indicatorSeriesRef.current.push(emaSeries);
    }

    if (indicators.alligator) {
      if (indicatorData.alligator.jaw.length > 0) {
        const jawSeries = chartRef.current.addSeries(LineSeries, {
          color: "#007AFF",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        jawSeries.setData(indicatorData.alligator.jaw);
        indicatorSeriesRef.current.push(jawSeries);
      }

      if (indicatorData.alligator.teeth.length > 0) {
        const teethSeries = chartRef.current.addSeries(LineSeries, {
          color: "#FF3B30",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        teethSeries.setData(indicatorData.alligator.teeth);
        indicatorSeriesRef.current.push(teethSeries);
      }

      if (indicatorData.alligator.lips.length > 0) {
        const lipsSeries = chartRef.current.addSeries(LineSeries, {
          color: "#34C759",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        lipsSeries.setData(indicatorData.alligator.lips);
        indicatorSeriesRef.current.push(lipsSeries);
      }
    }
  }, [indicators, indicatorData]);

  return (
    <div 
      ref={chartContainerRef} 
      className={cn("w-full h-full min-h-[400px]", className)}
      data-testid="candlestick-chart"
    />
  );
}
