import { useState } from "react";
import { 
  Newspaper, ArrowLeft, TrendingUp, TrendingDown, Globe, 
  Bell, Clock, ExternalLink, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: "market" | "platform" | "crypto" | "forex" | "stocks";
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: string;
  source: string;
  imageUrl?: string;
}

const marketNews: NewsArticle[] = [
  { 
    id: 1, 
    title: "Bitcoin Surges Past $45,000 as Institutional Interest Grows", 
    summary: "Bitcoin reached new yearly highs amid increasing institutional adoption and ETF speculation.",
    category: "crypto",
    sentiment: "bullish",
    timestamp: "2 hours ago",
    source: "CryptoNews"
  },
  { 
    id: 2, 
    title: "EUR/USD Drops After ECB Rate Decision", 
    summary: "The Euro weakened against the Dollar following the European Central Bank's latest interest rate announcement.",
    category: "forex",
    sentiment: "bearish",
    timestamp: "4 hours ago",
    source: "ForexDaily"
  },
  { 
    id: 3, 
    title: "Tech Stocks Rally on Strong Earnings Reports", 
    summary: "Major technology companies reported better-than-expected quarterly results, driving the NASDAQ higher.",
    category: "stocks",
    sentiment: "bullish",
    timestamp: "6 hours ago",
    source: "MarketWatch"
  },
  { 
    id: 4, 
    title: "Ethereum Network Upgrade Scheduled for Next Month", 
    summary: "The Ethereum Foundation announced the date for the upcoming network upgrade aimed at improving scalability.",
    category: "crypto",
    sentiment: "bullish",
    timestamp: "8 hours ago",
    source: "CryptoInsider"
  },
  { 
    id: 5, 
    title: "Oil Prices Stabilize Amid Supply Concerns", 
    summary: "Crude oil prices found support as OPEC+ considers extending production cuts into the next quarter.",
    category: "market",
    sentiment: "neutral",
    timestamp: "12 hours ago",
    source: "EnergyNews"
  },
];

const platformNews: NewsArticle[] = [
  { 
    id: 101, 
    title: "New Trading Features Now Available", 
    summary: "We've added new chart indicators and trading tools to enhance your trading experience.",
    category: "platform",
    sentiment: "neutral",
    timestamp: "1 day ago",
    source: "Blue Way Trading"
  },
  { 
    id: 102, 
    title: "VIP Program Launch Announcement", 
    summary: "Introducing our new VIP program with exclusive benefits, higher payouts, and priority support.",
    category: "platform",
    sentiment: "neutral",
    timestamp: "2 days ago",
    source: "Blue Way Trading"
  },
  { 
    id: 103, 
    title: "Weekend Trading Hours Extended", 
    summary: "Trade cryptocurrencies 24/7 with our new extended weekend trading hours.",
    category: "platform",
    sentiment: "neutral",
    timestamp: "3 days ago",
    source: "Blue Way Trading"
  },
  { 
    id: 104, 
    title: "New Payment Methods Added", 
    summary: "We now support additional cryptocurrency deposits and faster withdrawal processing.",
    category: "platform",
    sentiment: "neutral",
    timestamp: "5 days ago",
    source: "Blue Way Trading"
  },
];

export default function News() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("market");

  const getSentimentIcon = (sentiment: NewsArticle["sentiment"]) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: NewsArticle["sentiment"]) => {
    switch (sentiment) {
      case "bullish":
        return "bg-success/20 text-success";
      case "bearish":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: NewsArticle["category"]) => {
    switch (category) {
      case "crypto":
        return "bg-orange-500/20 text-orange-500";
      case "forex":
        return "bg-blue-500/20 text-blue-500";
      case "stocks":
        return "bg-purple-500/20 text-purple-500";
      case "platform":
        return "bg-primary/20 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const renderNewsCard = (article: NewsArticle) => (
    <Card 
      key={article.id}
      className="glass-card p-4 hover-elevate cursor-pointer"
      data-testid={`card-news-${article.id}`}
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={cn("text-xs", getCategoryColor(article.category))}>
              {article.category.toUpperCase()}
            </Badge>
            {article.sentiment !== "neutral" && (
              <Badge className={cn("text-xs", getSentimentColor(article.sentiment))}>
                {getSentimentIcon(article.sentiment)}
                <span className="ml-1">{article.sentiment.toUpperCase()}</span>
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.summary}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.timestamp}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {article.source}
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center">
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
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
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                <Newspaper className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Market News & Updates</h2>
                <p className="text-sm text-muted-foreground">
                  Stay informed with the latest market trends and platform updates
                </p>
              </div>
            </div>
          </Card>

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

            <TabsContent value="market" className="mt-4 space-y-3">
              {marketNews.map(renderNewsCard)}
            </TabsContent>

            <TabsContent value="platform" className="mt-4 space-y-3">
              {platformNews.map(renderNewsCard)}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
