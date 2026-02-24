import { TrendingUp, Shield, Zap, Globe, ArrowRight } from "lucide-react";
import logoPath from "@assets/WhatsApp_Image_2026-01-22_at_7.2_(1)_1771943319406.png";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AssetRow } from "@/components/asset-row";
import { cryptoAssets, stockAssets, formatLargeNumber } from "@/lib/market-data";

export default function Landing() {
  const featuredAssets = [...cryptoAssets.slice(0, 3), ...stockAssets.slice(0, 2)];

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Multi-Asset Trading",
      description: "Trade crypto, forex, stocks, and ETFs all in one platform",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-Time Data",
      description: "Live market prices with instant trade execution",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your investments",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Markets",
      description: "Access markets from around the world 24/7",
    },
  ];

  const stats = [
    { value: "$2.5B+", label: "Trading Volume" },
    { value: "100K+", label: "Active Users" },
    { value: "150+", label: "Available Assets" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logoPath} alt="Bluewave Trading" className="h-8 object-contain" data-testid="img-header-logo" />
            </div>
            <a href="/api/login" data-testid="link-header-login">
              <Button variant="default" className="bg-gradient-to-r from-primary to-secondary">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px]" />
          
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Trade Smarter with{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Bluewave Trading
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                The professional trading platform for cryptocurrencies, forex, stocks, and ETFs. 
                Real-time market data, advanced charts, and instant execution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/api/login" data-testid="link-hero-login">
                  <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-secondary">
                    Start Trading
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>
            </div>

            <GlassCard className="max-w-2xl mx-auto p-2" gradient>
              <div className="space-y-1">
                {featuredAssets.map((asset) => (
                  <AssetRow key={asset.symbol} asset={asset} />
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <GlassCard key={index} className="p-6 text-center" gradient>
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2">
                    {stat.label}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Everything You Need to Trade
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Professional-grade tools and features designed for traders of all levels
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <GlassCard key={index} className="p-6" gradient>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <GlassCard className="p-8 sm:p-12 text-center" gradient>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Start Trading?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of traders on Bluewave Trading. Get started today.
              </p>
              <a href="/api/login" data-testid="link-cta-login">
                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-secondary">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </GlassCard>
          </div>
        </section>
      </main>

      <footer className="glass border-t border-border/30 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoPath} alt="Bluewave Trading" className="h-6 object-contain" data-testid="img-footer-logo" />
          </div>
          <p className="text-sm text-muted-foreground">
            Trading involves risk. This is a demo platform for educational purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
