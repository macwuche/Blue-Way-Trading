import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  LayoutDashboard, Users, Shield, CreditCard, Wallet, 
  Send, Newspaper, Crown, Settings, ArrowLeft, Menu,
  TrendingUp, TrendingDown, DollarSign, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import AdminUsers from "./users";
import AdminKyc from "./kyc";
import AdminPaymentMethods from "./payment-methods";
import AdminDeposits from "./deposits";
import AdminWithdrawals from "./withdrawals";
import AdminNews from "./news";
import AdminVip from "./vip";

const adminNavItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "Users" },
  { id: "kyc", icon: Shield, label: "KYC Verification" },
  { id: "payment-methods", icon: CreditCard, label: "Payment Methods" },
  { id: "deposits", icon: Wallet, label: "Deposits" },
  { id: "withdrawals", icon: Send, label: "Withdrawals" },
  { id: "news", icon: Newspaper, label: "News" },
  { id: "vip", icon: Crown, label: "VIP Levels" },
];

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: typeof TrendingUp;
}

const statsData: StatCard[] = [
  { label: "Total Users", value: "12,458", change: "+12.5%", changeType: "positive", icon: Users },
  { label: "Active Traders", value: "3,241", change: "+8.2%", changeType: "positive", icon: Activity },
  { label: "Total Deposits", value: "$2.4M", change: "+15.3%", changeType: "positive", icon: Wallet },
  { label: "Pending Withdrawals", value: "$45,230", change: "-5.1%", changeType: "negative", icon: Send },
];

function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to the Blue Way Trading Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.label} className="glass-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                stat.changeType === "positive" ? "bg-success/20" : 
                stat.changeType === "negative" ? "bg-destructive/20" : "bg-muted/20"
              )}>
                <stat.icon className={cn(
                  "w-5 h-5",
                  stat.changeType === "positive" ? "text-success" : 
                  stat.changeType === "negative" ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {stat.changeType === "positive" ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : stat.changeType === "negative" ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : null}
              <span className={cn(
                "text-sm font-medium",
                stat.changeType === "positive" ? "text-success" : 
                stat.changeType === "negative" ? "text-destructive" : "text-muted-foreground"
              )}>
                {stat.change}
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {[
              { action: "New user registered", user: "john_trader", time: "2 mins ago" },
              { action: "Deposit confirmed", user: "crypto_master", time: "5 mins ago" },
              { action: "Withdrawal approved", user: "forex_pro", time: "12 mins ago" },
              { action: "KYC verified", user: "new_investor", time: "25 mins ago" },
              { action: "VIP upgrade", user: "premium_user", time: "1 hour ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-yellow-500" />
                <span>KYC Reviews</span>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-500">23</Badge>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary" />
                <span>Pending Deposits</span>
              </div>
              <Badge className="bg-primary/20 text-primary">8</Badge>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-destructive" />
                <span>Pending Withdrawals</span>
              </div>
              <Badge className="bg-destructive/20 text-destructive">15</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/:page");
  const currentPage = match ? params?.page : "dashboard";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    if (id === "dashboard") {
      setLocation("/admin");
    } else {
      setLocation(`/admin/${id}`);
    }
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentPage) {
      case "users":
        return <AdminUsers />;
      case "kyc":
        return <AdminKyc />;
      case "payment-methods":
        return <AdminPaymentMethods />;
      case "deposits":
        return <AdminDeposits />;
      case "withdrawals":
        return <AdminWithdrawals />;
      case "news":
        return <AdminNews />;
      case "vip":
        return <AdminVip />;
      default:
        return <DashboardOverview />;
    }
  };

  const NavContent = () => (
    <nav className="space-y-1 p-2">
      {adminNavItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.id)}
          data-testid={`admin-nav-${item.id}`}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left",
            currentPage === item.id
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover-elevate"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/10 flex-col glass-dark">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Blue Way Trading</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <NavContent />
        </ScrollArea>
        <div className="p-4 border-t border-white/10">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation("/")}
            data-testid="button-exit-admin"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Admin
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between gap-2 px-4 h-14 border-b border-white/10 glass-dark">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-admin-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-dark border-white/10 w-64 p-0">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold">Blue Way Trading</h1>
                    <p className="text-xs text-muted-foreground">Admin Panel</p>
                  </div>
                </div>
              </div>
              <NavContent />
              <div className="p-4 border-t border-white/10 mt-auto">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit Admin
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="font-semibold">
            {adminNavItems.find(n => n.id === currentPage)?.label || "Dashboard"}
          </div>
          
          <div className="w-9" />
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            {renderContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
