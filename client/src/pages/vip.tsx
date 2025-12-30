import { 
  Crown, ArrowLeft, Star, Shield, Zap, 
  HeadphonesIcon, Percent, Clock, Award, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface VipTier {
  id: string;
  name: string;
  icon: typeof Crown;
  color: string;
  gradient: string;
  minDeposit: string;
  payout: string;
  benefits: string[];
  featured?: boolean;
}

const vipTiers: VipTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    icon: Award,
    color: "text-amber-700",
    gradient: "from-amber-700/20 to-amber-600/20",
    minDeposit: "100",
    payout: "80%",
    benefits: [
      "Basic trading features",
      "Standard withdrawal processing",
      "Email support",
      "Access to all markets"
    ]
  },
  {
    id: "silver",
    name: "Silver",
    icon: Shield,
    color: "text-gray-400",
    gradient: "from-gray-400/20 to-gray-300/20",
    minDeposit: "1,000",
    payout: "83%",
    benefits: [
      "All Bronze benefits",
      "Priority withdrawal processing",
      "Personal account manager",
      "Weekly market analysis",
      "Trading signals"
    ]
  },
  {
    id: "gold",
    name: "Gold",
    icon: Star,
    color: "text-yellow-500",
    gradient: "from-yellow-500/20 to-amber-500/20",
    minDeposit: "5,000",
    payout: "87%",
    featured: true,
    benefits: [
      "All Silver benefits",
      "Express withdrawal (same day)",
      "Exclusive trading strategies",
      "VIP trading room access",
      "Risk-free trades (3 per month)",
      "Higher trading limits"
    ]
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: Zap,
    color: "text-cyan-400",
    gradient: "from-cyan-400/20 to-blue-500/20",
    minDeposit: "25,000",
    payout: "90%",
    benefits: [
      "All Gold benefits",
      "Instant withdrawals",
      "24/7 dedicated support line",
      "Custom trading conditions",
      "Risk-free trades (10 per month)",
      "Exclusive events & gifts",
      "Personal trading coach"
    ]
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: Crown,
    color: "text-purple-400",
    gradient: "from-purple-400/20 to-pink-500/20",
    minDeposit: "100,000",
    payout: "95%",
    benefits: [
      "All Platinum benefits",
      "Highest payout rates",
      "No withdrawal limits",
      "Private wealth manager",
      "Unlimited risk-free trades",
      "Exclusive investment opportunities",
      "Luxury gifts & experiences",
      "Annual VIP retreat invitation"
    ]
  }
];

export default function Vip() {
  const [, setLocation] = useLocation();

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
            <Crown className="w-5 h-5 text-yellow-500" />
            <h1 className="text-lg font-semibold">VIP Program</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <Card className="glass-card p-4 md:p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-500/30 flex items-center justify-center">
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Exclusive VIP Benefits</h2>
                <p className="text-sm text-muted-foreground">
                  Unlock premium features and higher payouts
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="glass-card p-4 text-center">
              <Percent className="w-8 h-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-success">Up to 95%</div>
              <div className="text-sm text-muted-foreground">Maximum Payout</div>
            </Card>
            <Card className="glass-card p-4 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">Instant</div>
              <div className="text-sm text-muted-foreground">VIP Withdrawals</div>
            </Card>
            <Card className="glass-card p-4 text-center">
              <HeadphonesIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-muted-foreground">Priority Support</div>
            </Card>
          </div>

          <h3 className="text-lg font-semibold pt-4">VIP Tiers</h3>

          <div className="space-y-4">
            {vipTiers.map((tier) => (
              <Card 
                key={tier.id}
                className={cn(
                  "glass-card overflow-hidden",
                  tier.featured && "ring-2 ring-yellow-500/50"
                )}
                data-testid={`card-vip-${tier.id}`}
              >
                {tier.featured && (
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold text-center py-1">
                    MOST POPULAR
                  </div>
                )}
                <div className={cn("p-4 bg-gradient-to-r", tier.gradient)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center",
                        tier.color
                      )}>
                        <tier.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">{tier.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Min deposit: ${tier.minDeposit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-2xl font-bold", tier.color)}>{tier.payout}</div>
                      <div className="text-xs text-muted-foreground">Payout</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={cn("w-4 h-4", tier.color)} />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full mt-4"
                    variant={tier.featured ? "default" : "outline"}
                    onClick={() => setLocation("/deposit")}
                    data-testid={`button-upgrade-${tier.id}`}
                  >
                    {tier.id === "bronze" ? "Get Started" : "Upgrade to " + tier.name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="glass-card p-4 md:p-6 mt-6">
            <h3 className="font-semibold mb-3">How to Become a VIP</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p>Make a qualifying deposit to reach your desired VIP tier</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p>Your VIP status is automatically activated within 24 hours</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p>Enjoy exclusive benefits and higher payouts on all trades</p>
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
