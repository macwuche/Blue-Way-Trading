import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  LayoutDashboard, Users, Shield, CreditCard, Wallet, 
  Send, Newspaper, Crown, Settings, ArrowLeft, Menu,
  TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw,
  Lock, Mail, LogOut, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

import AdminUsers from "./users";
import AdminKyc from "./kyc";
import AdminPaymentMethods from "./payment-methods";
import AdminDeposits from "./deposits";
import AdminWithdrawals from "./withdrawals";
import AdminNews from "./news";
import AdminVip from "./vip";
import TradeForUsers from "./trade-for-users";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const adminNavItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "Users" },
  { id: "trade-for-users", icon: Activity, label: "Trade for Users" },
  { id: "all-trades", icon: BarChart3, label: "All Trades", href: "/admin/trades" },
  { id: "kyc", icon: Shield, label: "KYC Verification" },
  { id: "payment-methods", icon: CreditCard, label: "Payment Methods" },
  { id: "deposits", icon: Wallet, label: "Deposits" },
  { id: "withdrawals", icon: Send, label: "Withdrawals" },
  { id: "news", icon: Newspaper, label: "News" },
  { id: "vip", icon: Crown, label: "VIP Levels" },
];

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: string;
  pendingWithdrawals: string;
  totalTrades: number;
  totalProfit: string;
}

interface PendingCounts {
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
}

function DashboardOverview() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingDeposits } = useQuery<any[]>({
    queryKey: ["/api/admin/deposits", { status: "pending" }],
  });

  const { data: pendingWithdrawals } = useQuery<any[]>({
    queryKey: ["/api/admin/withdrawals", { status: "pending" }],
  });

  const pendingCounts: PendingCounts = {
    pendingDeposits: pendingDeposits?.length || 0,
    pendingWithdrawals: pendingWithdrawals?.length || 0,
    pendingKyc: 0,
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const statsData = [
    { label: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: Users, color: "primary" },
    { label: "Active Traders", value: stats?.activeUsers?.toLocaleString() || "0", icon: Activity, color: "success" },
    { label: "Total Deposits", value: formatCurrency(stats?.totalDeposits || "0"), icon: Wallet, color: "primary" },
    { label: "Pending Withdrawals", value: formatCurrency(stats?.pendingWithdrawals || "0"), icon: Send, color: "destructive" },
    { label: "Total Trades", value: stats?.totalTrades?.toLocaleString() || "0", icon: TrendingUp, color: "primary" },
    { label: "Platform Profit", value: formatCurrency(stats?.totalProfit || "0"), icon: DollarSign, color: "success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Welcome to the Blue Way Trading Admin Panel</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetchStats()}
          disabled={statsLoading}
          data-testid="button-refresh-stats"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", statsLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statsData.map((stat) => (
          <Card key={stat.label} className="glass-card p-3 sm:p-4">
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-lg sm:text-xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2",
                    stat.color === "success" ? "bg-success/20" : 
                    stat.color === "destructive" ? "bg-destructive/20" : "bg-primary/20"
                  )}>
                    <stat.icon className={cn(
                      "w-4 h-4",
                      stat.color === "success" ? "text-success" : 
                      stat.color === "destructive" ? "text-destructive" : "text-primary"
                    )} />
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-yellow-500" />
                <span className="text-sm sm:text-base">KYC Reviews</span>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-500">{pendingCounts.pendingKyc}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm sm:text-base">Pending Deposits</span>
              </div>
              <Badge className="bg-primary/20 text-primary">{pendingCounts.pendingDeposits}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-destructive" />
                <span className="text-sm sm:text-base">Pending Withdrawals</span>
              </div>
              <Badge className="bg-destructive/20 text-destructive">{pendingCounts.pendingWithdrawals}</Badge>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm sm:text-base">Total Trades</span>
              </div>
              <span className="font-semibold">{stats?.totalTrades?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm sm:text-base">Active Users</span>
              </div>
              <span className="font-semibold">{stats?.activeUsers?.toLocaleString() || "0"}</span>
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="text-sm sm:text-base">Platform Profit</span>
              </div>
              <span className="font-semibold text-success">{formatCurrency(stats?.totalProfit || "0")}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminLoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      // First, log out any existing session to avoid conflicts
      try {
        await apiRequest("POST", "/api/auth/logout", {});
      } catch (e) {
        // Ignore logout errors - user might not be logged in
      }
      
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (data) => {
      if (!data.user?.isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        await apiRequest("POST", "/api/auth/logout", {});
        return;
      }
      
      // Set user data directly in cache
      queryClient.setQueryData(["/api/auth/user"], data.user);
      queryClient.setQueryData(["/api/auth/check"], { authenticated: true, user: data.user });
      queryClient.setQueryData(["/api/admin/auth"], { isAdmin: true, user: data.user });
      
      toast({
        title: "Welcome Admin",
        description: "Successfully logged in to admin panel",
      });
      
      onLoginSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#1c1e1e] p-4">
      <Card className="w-full max-w-md p-8 glass-card border-white/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-muted-foreground mt-2">
            Blue Way Trading Admin Panel
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="admin@bluewavetrading.live"
                        className="pl-10 glass-light border-white/10"
                        data-testid="input-admin-email"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10 glass-light border-white/10"
                        data-testid="input-admin-password"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Login to Admin Panel
                </>
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const [locationPath, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/:page");
  const currentPage = match ? params?.page : "dashboard";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const { toast } = useToast();

  // Check if admin is already authenticated
  const { data: adminAuth, isLoading: authLoading } = useQuery<{ isAdmin: boolean; user: any }>({
    queryKey: ["/api/admin/auth"],
    retry: false,
    staleTime: 0,
  });

  const isAuthenticated = adminLoggedIn || adminAuth?.isAdmin;

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    queryClient.clear();
    setAdminLoggedIn(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin panel",
    });
  };

  const handleNavClick = (id: string, href?: string) => {
    if (href) {
      setLocation(href);
    } else if (id === "dashboard") {
      setLocation("/admin");
    } else {
      setLocation(`/admin/${id}`);
    }
    setMobileMenuOpen(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#1c1e1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-subtle">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated as admin
  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={() => setAdminLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case "users":
        return <AdminUsers />;
      case "trade-for-users":
        return <TradeForUsers />;
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
          onClick={() => handleNavClick(item.id, (item as any).href)}
          data-testid={`admin-nav-${item.id}`}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left",
            currentPage === item.id || ((item as any).href && locationPath === (item as any).href)
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
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
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
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
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
