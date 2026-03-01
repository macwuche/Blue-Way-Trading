import { useState } from "react";
import { cn } from "@/lib/utils";
import { getAssetLogoUrl, getForexPairFlags } from "@/lib/asset-logos";

interface AssetLogoProps {
  symbol: string;
  type: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[8px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

const typeColors: Record<string, string> = {
  crypto: "bg-chart-1/20 text-chart-1",
  forex: "bg-chart-2/20 text-chart-2",
  stock: "bg-chart-3/20 text-chart-3",
  stocks: "bg-chart-3/20 text-chart-3",
  etf: "bg-chart-5/20 text-chart-5",
};

function normalizeType(type: string): string {
  const t = type.toLowerCase();
  if (t === "stocks") return "stock";
  return t;
}

function getInitials(symbol: string): string {
  if (symbol.includes("/")) {
    return symbol.split("/")[0].slice(0, 2);
  }
  return symbol.slice(0, 2);
}

export function AssetLogo({ symbol, type: rawType, size = "lg", className }: AssetLogoProps) {
  const [baseError, setBaseError] = useState(false);
  const [quoteError, setQuoteError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const type = normalizeType(rawType);
  const sizeClass = sizeClasses[size];

  if (type === "forex" && !baseError && !quoteError) {
    const flags = getForexPairFlags(symbol);
    if (flags.base && flags.quote) {
      return (
        <div className={cn("relative shrink-0", size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10", className)} data-testid={`asset-logo-${symbol}`}>
          <img
            src={flags.base}
            alt=""
            className={cn("rounded-full object-cover absolute top-0 left-0 border border-background",
              size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-7 h-7"
            )}
            onError={() => setBaseError(true)}
          />
          <img
            src={flags.quote}
            alt=""
            className={cn("rounded-full object-cover absolute bottom-0 right-0 border border-background",
              size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-7 h-7"
            )}
            onError={() => setQuoteError(true)}
          />
        </div>
      );
    }
  }

  const logoUrl = getAssetLogoUrl(symbol, type);

  if (logoUrl && !logoError) {
    return (
      <div className={cn("rounded-full overflow-hidden shrink-0 bg-white/10", sizeClass, className)} data-testid={`asset-logo-${symbol}`}>
        <img
          src={logoUrl}
          alt={symbol}
          className="w-full h-full object-cover"
          onError={() => setLogoError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-bold shrink-0", sizeClass, typeColors[type] || "bg-muted text-muted-foreground", className)}
      data-testid={`asset-logo-${symbol}`}
    >
      {getInitials(symbol)}
    </div>
  );
}
