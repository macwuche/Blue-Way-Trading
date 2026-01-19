import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Onboarding } from "@/components/onboarding";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import TradeRoom from "@/pages/traderoom";
import Portfolio from "@/pages/portfolio";
import History from "@/pages/history";
import Support from "@/pages/support";
import News from "@/pages/news";
import NewsDetail from "@/pages/news-detail";
import Vip from "@/pages/vip";
import Deposit from "@/pages/deposit";
import Withdrawal from "@/pages/withdrawal";
import Verification from "@/pages/verification";
import More from "@/pages/more";
import AdminDashboard from "@/pages/admin/dashboard";
import UserProfilePage from "@/pages/admin/user-profile";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { user, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.id}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, "true");
    }
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-subtle">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading Blue Way Trading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users/:userId" component={UserProfilePage} />
        <Route path="/admin/:page" component={AdminDashboard} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <>
      <Onboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
      <Switch>
        <Route path="/" component={TradeRoom} />
        <Route path="/trade" component={TradeRoom} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/history" component={History} />
        <Route path="/support" component={Support} />
        <Route path="/news" component={News} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/vip" component={Vip} />
        <Route path="/deposit" component={Deposit} />
        <Route path="/withdrawal" component={Withdrawal} />
        <Route path="/verification" component={Verification} />
        <Route path="/more" component={More} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users/:userId" component={UserProfilePage} />
        <Route path="/admin/:page" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
