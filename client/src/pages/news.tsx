import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, RefreshCw, Calendar, Filter, ExternalLink, 
  Loader2, Newspaper, ArrowLeft, Globe, Clock
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { useLocation } from "wouter";

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
  { value: "", label: "All Symbols" },
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
  { value: "", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
];

export default function NewsPage() {
  const [, setLocation] = useLocation();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  
  // Filter states
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Reset articles when filters change
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
  }, [selectedSymbol, selectedDate, debouncedSearch]);

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (selectedDate) {
      case "today":
        return { published_after: format(startOfDay(now), "yyyy-MM-dd") };
      case "yesterday":
        return {
          published_after: format(startOfDay(subDays(now, 1)), "yyyy-MM-dd"),
          published_before: format(startOfDay(now), "yyyy-MM-dd"),
        };
      case "week":
        return { published_after: format(subDays(now, 7), "yyyy-MM-dd") };
      case "month":
        return { published_after: format(subDays(now, 30), "yyyy-MM-dd") };
      default:
        return {};
    }
  };

  // Fetch news query
  const { data, isLoading, refetch, isFetching } = useQuery<NewsResponse>({
    queryKey: ["/api/news", selectedSymbol, selectedDate, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSymbol) params.set("symbols", selectedSymbol);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));
      params.set("limit", "10");
      
      const dateRange = getDateRange();
      if (dateRange.published_after) params.set("published_after", dateRange.published_after);
      if (dateRange.published_before) params.set("published_before", dateRange.published_before);
      
      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch news");
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Append new articles when data changes
  useEffect(() => {
    if (data?.articles) {
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
      setIsLoadingMore(false);
    }
  }, [data, page]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (page === 1) {
        refetch();
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refetch, page]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Load more when near bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isLoadingMore && !isFetching) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore, isFetching]);

  // Pull-to-refresh handlers
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
      setPage(1);
      setArticles([]);
      await refetch();
      setIsPullRefreshing(false);
    }
    isPulling.current = false;
  };

  const handleManualRefresh = async () => {
    setPage(1);
    setArticles([]);
    await refetch();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
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
              <h1 className="text-lg font-semibold">Market News</h1>
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
      
      {/* Filters */}
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm space-y-3">
        {/* Search bar */}
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
        
        {/* Filter row */}
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
      
      {/* Pull-to-refresh indicator */}
      {isPullRefreshing && (
        <div className="flex items-center justify-center py-4 bg-primary/10">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}
      
      {/* News list */}
      <ScrollArea 
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        <div
          ref={scrollContainerRef}
          className="p-4 space-y-4 pb-24 md:pb-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-testid="news-scroll-container"
        >
          {/* Loading skeletons */}
          {isLoading && articles.length === 0 && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
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
          
          {/* No articles message */}
          {!isLoading && articles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No news articles found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          )}
          
          {/* News articles */}
          {articles.map((article) => (
            <Card
              key={article.uuid}
              className="glass-card overflow-hidden hover-elevate cursor-pointer"
              onClick={() => window.open(article.url, "_blank")}
              data-testid={`news-article-${article.uuid}`}
            >
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-4 min-w-0">
                  {/* Symbol badges */}
                  {article.entities && article.entities.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {article.entities.slice(0, 3).map((entity) => (
                        <Badge
                          key={entity.symbol}
                          variant="secondary"
                          className="text-xs"
                        >
                          {entity.symbol}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Title */}
                  <h3 className="font-semibold mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  {/* Snippet */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.snippet || article.description}
                  </p>
                  
                  {/* Meta info */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(article.published_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {article.source}
                    </span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </div>
                </div>
                
                {/* Article image */}
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
          ))}
          
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
          
          {/* End of list */}
          {!hasMore && articles.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No more articles to load
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
