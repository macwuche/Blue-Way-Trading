import { useState } from "react";
import { 
  Newspaper, ArrowLeft, TrendingUp, TrendingDown, Globe, 
  Bell, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: "market" | "platform" | "crypto" | "forex" | "stocks";
  sentiment: "bullish" | "bearish" | "neutral";
  timestamp: string;
  source: string;
  imageUrl: string;
}

export const marketNews: NewsArticle[] = [
  { 
    id: 1, 
    title: "Bitcoin Surges Past $45,000 as Institutional Interest Grows", 
    summary: "Bitcoin reached new yearly highs amid increasing institutional adoption and ETF speculation.",
    content: "Bitcoin has surged past the $45,000 mark, reaching its highest level this year as institutional interest continues to grow. Major financial institutions are increasingly looking to add Bitcoin to their portfolios, with several pending ETF applications driving optimism in the market.\n\nAnalysts suggest this rally could be the beginning of a larger bull run, as both retail and institutional investors show renewed confidence in the cryptocurrency market. Trading volumes have increased significantly across major exchanges.\n\nThe approval of Bitcoin ETFs could bring billions of dollars into the market, potentially pushing prices even higher. Market experts recommend watching key resistance levels around $48,000 and $50,000 in the coming weeks.",
    category: "crypto",
    sentiment: "bullish",
    timestamp: "2 hours ago",
    source: "CryptoNews",
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop"
  },
  { 
    id: 2, 
    title: "EUR/USD Drops After ECB Rate Decision", 
    summary: "The Euro weakened against the Dollar following the European Central Bank's latest interest rate announcement.",
    content: "The EUR/USD pair fell sharply today after the European Central Bank announced its latest interest rate decision, keeping rates unchanged but signaling a more dovish stance than expected.\n\nTraders had anticipated a more hawkish tone from ECB officials, but the central bank emphasized concerns about slowing economic growth in the eurozone. The Euro dropped by over 50 pips against the US Dollar in the immediate aftermath.\n\nMarket participants are now pricing in potential rate cuts in the first half of next year, which could put additional pressure on the Euro. Technical analysis suggests support at the 1.0800 level, with resistance at 1.0950.",
    category: "forex",
    sentiment: "bearish",
    timestamp: "4 hours ago",
    source: "ForexDaily",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop"
  },
  { 
    id: 3, 
    title: "Tech Stocks Rally on Strong Earnings Reports", 
    summary: "Major technology companies reported better-than-expected quarterly results, driving the NASDAQ higher.",
    content: "Technology stocks led a broad market rally today as several major companies reported earnings that exceeded Wall Street expectations. The NASDAQ Composite rose by over 2% in response to the positive results.\n\nCompanies in the semiconductor and cloud computing sectors showed particular strength, with some stocks gaining over 5% in a single session. Analysts are optimistic about the technology sector's prospects for the remainder of the year.\n\nThe strong earnings reports have renewed investor confidence in growth stocks, which had faced pressure earlier in the year due to rising interest rates. Fund managers are now increasing their technology allocations ahead of the holiday shopping season.",
    category: "stocks",
    sentiment: "bullish",
    timestamp: "6 hours ago",
    source: "MarketWatch",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop"
  },
  { 
    id: 4, 
    title: "Ethereum Network Upgrade Scheduled for Next Month", 
    summary: "The Ethereum Foundation announced the date for the upcoming network upgrade aimed at improving scalability.",
    content: "The Ethereum Foundation has officially announced the date for the next major network upgrade, which promises to significantly improve the blockchain's scalability and reduce transaction fees.\n\nThe upgrade, known as Dencun, will introduce proto-danksharding, a key step towards full sharding that will dramatically increase the network's capacity. This is expected to benefit Layer 2 solutions and reduce costs for users.\n\nDevelopers have been testing the upgrade on various testnets for months, and all major milestones have been met successfully. The Ethereum community is optimistic about the upgrade's potential to address long-standing scalability concerns.",
    category: "crypto",
    sentiment: "bullish",
    timestamp: "8 hours ago",
    source: "CryptoInsider",
    imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=300&fit=crop"
  },
  { 
    id: 5, 
    title: "Oil Prices Stabilize Amid Supply Concerns", 
    summary: "Crude oil prices found support as OPEC+ considers extending production cuts into the next quarter.",
    content: "Crude oil prices have stabilized after recent volatility, finding support as OPEC+ members discuss the possibility of extending production cuts into the next quarter. Brent crude is trading around $82 per barrel.\n\nSupply concerns remain at the forefront of traders' minds, with geopolitical tensions in key producing regions adding uncertainty to the market. Demand forecasts have also been revised upward by several major energy agencies.\n\nAnalysts expect oil prices to remain supported in the near term, with the winter heating season approaching in the Northern Hemisphere. However, a potential economic slowdown could limit the upside potential.",
    category: "market",
    sentiment: "neutral",
    timestamp: "12 hours ago",
    source: "EnergyNews",
    imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=300&fit=crop"
  },
];

export const platformNews: NewsArticle[] = [
  { 
    id: 101, 
    title: "New Trading Features Now Available", 
    summary: "We've added new chart indicators and trading tools to enhance your trading experience.",
    content: "We're excited to announce the launch of several new trading features designed to give you an edge in the markets. These updates include advanced chart indicators, improved order execution, and new analysis tools.\n\nNew chart indicators include:\n- Bollinger Bands with customizable settings\n- MACD with signal line crossover alerts\n- RSI with divergence detection\n- Volume profile analysis\n\nOur trading interface has also been optimized for faster execution and improved reliability. We've reduced latency by 40% and added new order types to give you more flexibility in your trading strategy.\n\nThese features are now available to all users. VIP members also get access to exclusive premium indicators.",
    category: "platform",
    sentiment: "neutral",
    timestamp: "1 day ago",
    source: "Blue Way Trading",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop"
  },
  { 
    id: 102, 
    title: "VIP Program Launch Announcement", 
    summary: "Introducing our new VIP program with exclusive benefits, higher payouts, and priority support.",
    content: "We're thrilled to introduce our new VIP membership program, designed to reward our most active traders with exclusive benefits and premium features.\n\nVIP Benefits include:\n- Higher payout rates up to 95%\n- Priority customer support\n- Personal account manager\n- Exclusive market analysis and signals\n- Faster withdrawal processing\n- Special trading bonuses\n\nOur VIP program features five tiers: Bronze, Silver, Gold, Platinum, and Diamond. Each tier unlocks additional benefits based on your trading volume and account status.\n\nTo learn more about becoming a VIP member and the requirements for each tier, visit the VIP section in your account settings.",
    category: "platform",
    sentiment: "neutral",
    timestamp: "2 days ago",
    source: "Blue Way Trading",
    imageUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop"
  },
  { 
    id: 103, 
    title: "Weekend Trading Hours Extended", 
    summary: "Trade cryptocurrencies 24/7 with our new extended weekend trading hours.",
    content: "Great news for our traders! We've extended our weekend trading hours to allow you to trade cryptocurrencies around the clock, including weekends and holidays.\n\nThis update means you can now:\n- Trade Bitcoin, Ethereum, and other major cryptocurrencies 24/7\n- Take advantage of market movements that occur outside traditional trading hours\n- Never miss a trading opportunity\n\nWhile cryptocurrency trading is now available 24/7, please note that forex and stock trading remains subject to standard market hours. Our support team is also available on weekends for VIP members.\n\nStart trading now and take advantage of the extended hours!",
    category: "platform",
    sentiment: "neutral",
    timestamp: "3 days ago",
    source: "Blue Way Trading",
    imageUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop"
  },
  { 
    id: 104, 
    title: "New Payment Methods Added", 
    summary: "We now support additional cryptocurrency deposits and faster withdrawal processing.",
    content: "To make trading more accessible, we've added several new payment methods and improved our withdrawal processing times.\n\nNew deposit methods include:\n- Tether (USDT) on multiple networks (ERC-20, TRC-20, BEP-20)\n- USD Coin (USDC)\n- Binance Pay\n- Apple Pay and Google Pay\n\nWithdrawal improvements:\n- Processing times reduced to under 24 hours for verified accounts\n- VIP members receive priority processing\n- Lower minimum withdrawal amounts\n\nAll deposits are subject to our standard verification procedures. For larger transactions, additional verification may be required as part of our commitment to security and compliance.\n\nStart depositing with your preferred method today!",
    category: "platform",
    sentiment: "neutral",
    timestamp: "5 days ago",
    source: "Blue Way Trading",
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop"
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

  const handleNewsClick = (article: NewsArticle) => {
    setLocation(`/news/${article.id}`);
  };

  const renderNewsCard = (article: NewsArticle) => (
    <Card 
      key={article.id}
      className="glass-card overflow-hidden hover-elevate cursor-pointer"
      onClick={() => handleNewsClick(article)}
      data-testid={`card-news-${article.id}`}
    >
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-4 min-w-0">
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
        
        <div className="w-full md:w-32 lg:w-40 h-32 md:h-auto flex-shrink-0">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
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
