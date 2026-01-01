import { 
  ArrowLeft, Clock, Globe, TrendingUp, TrendingDown, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { marketNews, platformNews, type NewsArticle } from "./news";
import { useToast } from "@/hooks/use-toast";

export default function NewsDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const allNews = [...marketNews, ...platformNews];
  const article = allNews.find(n => n.id === Number(params.id));

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center">
        <Card className="glass-card p-8 text-center max-w-md mx-4">
          <h2 className="text-xl font-bold mb-2">Article Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The news article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/news")} data-testid="button-back-to-news">
            Back to News
          </Button>
        </Card>
      </div>
    );
  }

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Article link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const relatedNews = allNews
    .filter(n => n.id !== article.id && n.category === article.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/news")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold line-clamp-1">News</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="pb-24 md:pb-8">
          <div className="w-full h-48 md:h-72 lg:h-96 relative">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>

          <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto -mt-16 relative z-10">
            <Card className="glass-card p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
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

              <h1 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-article-title">
                {article.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/30">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.timestamp}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {article.source}
                </span>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-article-summary">
                  {article.summary}
                </p>
                
                <div className="text-foreground whitespace-pre-line leading-relaxed" data-testid="text-article-content">
                  {article.content}
                </div>
              </div>
            </Card>

            {relatedNews.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Related Articles</h2>
                <div className="space-y-3">
                  {relatedNews.map((related) => (
                    <Card 
                      key={related.id}
                      className="glass-card overflow-hidden hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/news/${related.id}`)}
                      data-testid={`card-related-news-${related.id}`}
                    >
                      <div className="flex">
                        <div className="flex-1 p-4 min-w-0">
                          <Badge className={cn("text-xs mb-2", getCategoryColor(related.category))}>
                            {related.category.toUpperCase()}
                          </Badge>
                          <h3 className="font-semibold line-clamp-2 mb-1">{related.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {related.timestamp}
                          </div>
                        </div>
                        <div className="w-24 h-24 flex-shrink-0">
                          <img 
                            src={related.imageUrl} 
                            alt={related.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
