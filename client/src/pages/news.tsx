import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, RefreshCw, Calendar, Filter, ExternalLink, 
  Loader2, Newspaper, ArrowLeft, Globe, Clock, Bell,
  TrendingUp, TrendingDown
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  image_url: string | null;
  published_at: string;
  source: string;
  relevance_score: number | null;
  entities: Array<{
    symbol: string;
    name: string;
    type: string;
    match_score: number;
  }>;
  sentiment?: "bullish" | "bearish" | "neutral";
  category?: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
  cached: boolean;
  cacheAge?: number;
}

const SYMBOLS = [
  { value: "all", label: "All Symbols" },
  { value: "AAPL", label: "AAPL - Apple" },
  { value: "GOOGL", label: "GOOGL - Alphabet" },
  { value: "MSFT", label: "MSFT - Microsoft" },
  { value: "AMZN", label: "AMZN - Amazon" },
  { value: "TSLA", label: "TSLA - Tesla" },
  { value: "NVDA", label: "NVDA - Nvidia" },
  { value: "META", label: "META - Meta" },
  { value: "BTC", label: "BTC - Bitcoin" },
  { value: "ETH", label: "ETH - Ethereum" },
];

const DATE_FILTERS = [
  { value: "any", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
];

const FALLBACK_MARKET_NEWS: NewsArticle[] = [
  { 
    uuid: "fallback-1",
    title: "Bitcoin Surges Past $45,000 as Institutional Interest Grows", 
    description: "Bitcoin reached new yearly highs amid increasing institutional adoption and ETF speculation.",
    snippet: "Bitcoin has surged past the $45,000 mark, reaching its highest level this year as institutional interest continues to grow.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [{ symbol: "BTC", name: "Bitcoin", type: "crypto", match_score: 1 }],
    sentiment: "bullish",
    category: "crypto"
  },
  { 
    uuid: "fallback-2",
    title: "EUR/USD Drops After ECB Rate Decision", 
    description: "The Euro weakened against the Dollar following the European Central Bank's latest interest rate announcement.",
    snippet: "The EUR/USD pair fell sharply today after the European Central Bank announced its latest interest rate decision.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [{ symbol: "EUR/USD", name: "Euro/US Dollar", type: "forex", match_score: 1 }],
    sentiment: "bearish",
    category: "forex"
  },
  { 
    uuid: "fallback-3",
    title: "Tech Stocks Rally on Strong Earnings Reports", 
    description: "Major technology companies reported better-than-expected quarterly results, driving the NASDAQ higher.",
    snippet: "Technology stocks led a broad market rally today as several major companies reported earnings that exceeded Wall Street expectations.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [
      { symbol: "AAPL", name: "Apple", type: "stock", match_score: 1 },
      { symbol: "MSFT", name: "Microsoft", type: "stock", match_score: 1 }
    ],
    sentiment: "bullish",
    category: "stocks"
  },
  { 
    uuid: "fallback-4",
    title: "Ethereum Network Upgrade Scheduled for Next Month", 
    description: "The Ethereum Foundation announced the date for the upcoming network upgrade aimed at improving scalability.",
    snippet: "The Ethereum Foundation has officially announced the date for the next major network upgrade, which promises to significantly improve scalability.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [{ symbol: "ETH", name: "Ethereum", type: "crypto", match_score: 1 }],
    sentiment: "bullish",
    category: "crypto"
  },
  { 
    uuid: "fallback-5",
    title: "Oil Prices Stabilize Amid Supply Concerns", 
    description: "Crude oil prices found support as OPEC+ considers extending production cuts into the next quarter.",
    snippet: "Crude oil prices have stabilized after recent volatility, finding support as OPEC+ members discuss extending production cuts.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [],
    sentiment: "neutral",
    category: "commodities"
  },
];

const PLATFORM_NEWS: NewsArticle[] = [
  { 
    uuid: "platform-1",
    title: "New Trading Features Now Available", 
    description: "We've added new chart indicators and trading tools to enhance your trading experience.",
    snippet: "We're excited to announce the launch of several new trading features designed to give you an edge in the markets.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [],
    sentiment: "neutral",
    category: "platform"
  },
  { 
    uuid: "platform-2",
    title: "VIP Program Launch Announcement", 
    description: "Introducing our new VIP program with exclusive benefits, higher payouts, and priority support.",
    snippet: "We're thrilled to introduce our new VIP membership program, designed to reward our most active traders.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [],
    sentiment: "neutral",
    category: "platform"
  },
  { 
    uuid: "platform-3",
    title: "Weekend Trading Hours Extended", 
    description: "Trade cryptocurrencies 24/7 with our new extended weekend trading hours.",
    snippet: "Great news for our traders! We've extended our weekend trading hours for cryptocurrency trading.",
    url: "#",
    image_url: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop",
    published_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    source: "Blue Way Trading",
    relevance_score: null,
    entities: [],
    sentiment: "neutral",
    category: "platform"
  },
];

export default function NewsPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("market");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  
  const [selectedSymbol, setSelectedSymbol] = useState("all");
  const [selectedDate, setSelectedDate] = useState("any");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);
  const refreshInProgress = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [selectedSymbol, selectedDate, debouncedSearch]);

  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedSymbol && selectedSymbol !== "all") params.set("symbols", selectedSymbol);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("limit", "10");
    
    const now = new Date();
    switch (selectedDate) {
      case "today":
        params.set("published_after", format(startOfDay(now), "yyyy-MM-dd"));
        break;
      case "yesterday":
        params.set("published_after", format(startOfDay(subDays(now, 1)), "yyyy-MM-dd"));
        params.set("published_before", format(startOfDay(now), "yyyy-MM-dd"));
        break;
      case "week":
        params.set("published_after", format(subDays(now, 7), "yyyy-MM-dd"));
        break;
      case "month":
        params.set("published_after", format(subDays(now, 30), "yyyy-MM-dd"));
        break;
      case "any":
      default:
        break;
    }
    
    return params.toString();
  }, [selectedSymbol, selectedDate, debouncedSearch, page]);

  const queryKey = ["/api/news", selectedSymbol, selectedDate, debouncedSearch, page] as const;

  const { data, isLoading, isFetching } = useQuery<NewsResponse>({
    queryKey,
    queryFn: async () => {
      const url = `/api/news?${getQueryParams()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const doRefresh = useCallback(async () => {
    refreshInProgress.current = true;
    setPage(1);
    const page1Key = ["/api/news", selectedSymbol, selectedDate, debouncedSearch, 1];
    
    const params = new URLSearchParams();
    if (selectedSymbol && selectedSymbol !== "all") params.set("symbols", selectedSymbol);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", "1");
    params.set("limit", "10");
    
    const now = new Date();
    switch (selectedDate) {
      case "today":
        params.set("published_after", format(startOfDay(now), "yyyy-MM-dd"));
        break;
      case "yesterday":
        params.set("published_after", format(startOfDay(subDays(now, 1)), "yyyy-MM-dd"));
        params.set("published_before", format(startOfDay(now), "yyyy-MM-dd"));
        break;
      case "week":
        params.set("published_after", format(subDays(now, 7), "yyyy-MM-dd"));
        break;
      case "month":
        params.set("published_after", format(subDays(now, 30), "yyyy-MM-dd"));
        break;
    }
    
    const applyFallback = () => {
      const fallbackData: NewsResponse = {
        articles: FALLBACK_MARKET_NEWS,
        meta: { found: FALLBACK_MARKET_NEWS.length, returned: FALLBACK_MARKET_NEWS.length, limit: 10, page: 1 },
        cached: false,
      };
      queryClient.setQueryData(page1Key, fallbackData);
      setArticles(FALLBACK_MARKET_NEWS);
      setHasMore(false);
    };
    
    try {
      await queryClient.cancelQueries({ queryKey: page1Key });
      const response = await fetch(`/api/news?${params.toString()}`);
      
      if (!response.ok) {
        applyFallback();
        return;
      }
      
      const result = await response.json() as NewsResponse;
      
      if (result?.articles && result.articles.length > 0) {
        queryClient.setQueryData(page1Key, result);
        setArticles(result.articles);
        setHasMore(result.articles.length >= 10);
      } else {
        applyFallback();
      }
    } catch (error) {
      applyFallback();
    } finally {
      refreshInProgress.current = false;
    }
  }, [selectedSymbol, selectedDate, debouncedSearch, queryClient]);

  useEffect(() => {
    if (!data) return;
    if (refreshInProgress.current) return;
    
    if (data.articles && data.articles.length > 0) {
      if (page === 1) {
        setArticles(data.articles);
      } else {
        setArticles(prev => {
          const existingIds = new Set(prev.map(a => a.uuid));
          const newArticles = data.articles.filter(a => !existingIds.has(a.uuid));
          return [...prev, ...newArticles];
        });
      }
      setHasMore(data.articles.length >= 10);
    } else if (page === 1) {
      setArticles(FALLBACK_MARKET_NEWS);
      setHasMore(false);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  }, [data, page]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (page === 1 && activeTab === "market") {
        await doRefresh();
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [page, activeTab, doRefresh]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isLoadingMore && !isFetching) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore, isFetching]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const pullDistance = e.touches[0].clientY - pullStartY.current;
    if (pullDistance > 80) {
      setIsPullRefreshing(true);
    }
  };

  const handleTouchEnd = async () => {
    if (isPullRefreshing) {
      await doRefresh();
      setIsPullRefreshing(false);
    }
    isPulling.current = false;
  };

  const handleManualRefresh = async () => {
    await doRefresh();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "bullish":
        return "bg-success/20 text-success";
      case "bearish":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="w-3 h-3" />;
      case "bearish":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const renderNewsCard = (article: NewsArticle) => (
    <Card
      key={article.uuid}
      className="glass-card overflow-hidden hover-elevate cursor-pointer"
      onClick={() => setSelectedArticle(article)}
      data-testid={`news-article-${article.uuid}`}
    >
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {article.category && (
              <Badge variant="secondary" className="text-xs uppercase">
                {article.category}
              </Badge>
            )}
            {article.sentiment && article.sentiment !== "neutral" && (
              <Badge className={cn("text-xs", getSentimentColor(article.sentiment))}>
                {getSentimentIcon(article.sentiment)}
                <span className="ml-1">{article.sentiment.toUpperCase()}</span>
              </Badge>
            )}
            {article.entities?.slice(0, 2).map((entity) => (
              <Badge
                key={entity.symbol}
                variant="outline"
                className="text-xs"
              >
                {entity.symbol}
              </Badge>
            ))}
          </div>
          
          <h3 className="font-semibold mb-2 line-clamp-2">
            {article.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.snippet || article.description}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(article.published_at)}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {article.source}
            </span>
            {article.url !== "#" && (
              <ExternalLink className="h-3 w-3 ml-auto" />
            )}
          </div>
        </div>
        
        {article.image_url && (
          <div className="w-full md:w-32 lg:w-40 h-32 md:h-auto flex-shrink-0">
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );

  const displayArticles = activeTab === "market" ? articles : PLATFORM_NEWS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">News</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isFetching}
            data-testid="button-refresh-news"
          >
            <RefreshCw className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="p-4 pb-0">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Market News & Updates</h2>
              <p className="text-sm text-muted-foreground">
                Stay informed with the latest market trends
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="p-4 pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full glass-light">
            <TabsTrigger value="market" className="flex-1" data-testid="tab-market-news">
              <TrendingUp className="w-4 h-4 mr-2" />
              Market News
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex-1" data-testid="tab-platform-news">
              <Bell className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {activeTab === "market" && (
        <div className="px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
              data-testid="input-news-search"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-[160px]" data-testid="select-symbol-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[140px]" data-testid="select-date-filter">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {isPullRefreshing && (
        <div className="flex items-center justify-center py-4 bg-primary/10">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}
      
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 pb-24 md:pb-4"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="news-scroll-container"
      >
        {isLoading && articles.length === 0 && activeTab === "market" && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {!isLoading && displayArticles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No news articles found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        )}
        
        {displayArticles.map(renderNewsCard)}
        
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
        )}
        
        {!hasMore && displayArticles.length > 0 && activeTab === "market" && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {articles.length === FALLBACK_MARKET_NEWS.length && articles[0]?.uuid.startsWith("fallback")
              ? "Showing sample news - live feed unavailable"
              : "No more articles to load"}
          </div>
        )}
      </div>

      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh] overflow-y-auto" data-testid="news-article-modal">
          {selectedArticle && (
            <div className="flex flex-col h-full">
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {selectedArticle.category && (
                    <Badge variant="secondary" className="text-xs uppercase">
                      {selectedArticle.category}
                    </Badge>
                  )}
                  {selectedArticle.sentiment && selectedArticle.sentiment !== "neutral" && (
                    <Badge className={cn("text-xs", getSentimentColor(selectedArticle.sentiment))}>
                      {getSentimentIcon(selectedArticle.sentiment)}
                      <span className="ml-1">{selectedArticle.sentiment.toUpperCase()}</span>
                    </Badge>
                  )}
                  {selectedArticle.entities?.slice(0, 3).map((entity) => (
                    <Badge
                      key={entity.symbol}
                      variant="outline"
                      className="text-xs"
                    >
                      {entity.symbol}
                    </Badge>
                  ))}
                </div>
                <DialogTitle className="text-2xl leading-tight font-bold">
                  {selectedArticle.title}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto mt-4">
                {selectedArticle.image_url && (
                  <div className="w-full h-64 rounded-lg overflow-hidden mb-6">
                    <img
                      src={selectedArticle.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(selectedArticle.published_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {selectedArticle.source}
                  </span>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-foreground leading-relaxed text-base whitespace-pre-wrap">
                    {selectedArticle.description || selectedArticle.snippet}
                  </p>
                  {selectedArticle.snippet && selectedArticle.description && selectedArticle.snippet !== selectedArticle.description && (
                    <p className="text-foreground leading-relaxed text-base whitespace-pre-wrap mt-4">
                      {selectedArticle.snippet}
                    </p>
                  )}
                </div>
              </div>

              {selectedArticle.url && selectedArticle.url !== "#" && (
                <div className="flex-shrink-0 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedArticle.url, "_blank")}
                    data-testid="button-read-full-article"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Read Full Article
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
