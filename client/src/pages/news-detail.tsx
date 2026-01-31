import { 
  ArrowLeft, Clock, Globe, Share2, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewsDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center">
      <Card className="glass-card p-8 text-center max-w-md mx-4">
        <h2 className="text-xl font-bold mb-2">External Article</h2>
        <p className="text-muted-foreground mb-4">
          News articles now open in a new tab directly from the source.
        </p>
        <Button onClick={() => setLocation("/news")} data-testid="button-back-to-news">
          Back to News
        </Button>
      </Card>
    </div>
  );
}
