import { 
  Settings, ArrowLeft, User, Bell, Shield, 
  HelpCircle, LogOut, Moon, Sun, ChevronRight,
  Smartphone, Globe, CreditCard, FileText, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SettingItem {
  id: string;
  icon: typeof Settings;
  label: string;
  description?: string;
  type: "link" | "toggle" | "action";
  value?: boolean;
}

const settingsSections = [
  {
    title: "Account",
    items: [
      { id: "profile", icon: User, label: "Profile Settings", description: "Manage your account details", type: "link" as const },
      { id: "notifications", icon: Bell, label: "Notifications", description: "Configure alerts and updates", type: "toggle" as const, value: true },
      { id: "security", icon: Shield, label: "Security", description: "Password and 2FA settings", type: "link" as const },
    ]
  },
  {
    title: "Preferences",
    items: [
      { id: "theme", icon: Moon, label: "Dark Mode", description: "Toggle dark/light theme", type: "toggle" as const, value: true },
      { id: "language", icon: Globe, label: "Language", description: "English (US)", type: "link" as const },
      { id: "sounds", icon: Smartphone, label: "Sound Effects", description: "Trading sounds and alerts", type: "toggle" as const, value: true },
    ]
  },
  {
    title: "Trading",
    items: [
      { id: "payment", icon: CreditCard, label: "Payment Methods", description: "Manage deposits and withdrawals", type: "link" as const },
      { id: "limits", icon: Shield, label: "Trading Limits", description: "Set your risk preferences", type: "link" as const },
    ]
  },
  {
    title: "Support",
    items: [
      { id: "help", icon: HelpCircle, label: "Help Center", description: "FAQs and guides", type: "link" as const },
      { id: "terms", icon: FileText, label: "Terms of Service", description: "Legal information", type: "link" as const },
      { id: "rate", icon: Star, label: "Rate the App", description: "Share your feedback", type: "link" as const },
    ]
  }
];

export default function More() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">More</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {user?.firstName?.slice(0, 1).toUpperCase() || "T"}{user?.lastName?.slice(0, 1).toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-semibold" data-testid="text-username">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Trader"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "trader@example.com"}
                </p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-edit-profile">
                Edit
              </Button>
            </div>
          </Card>

          {settingsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                {section.title}
              </h3>
              <Card className="glass-card divide-y divide-border/20 overflow-hidden">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-4",
                      item.type === "link" && "hover-elevate cursor-pointer"
                    )}
                    data-testid={`setting-${item.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {item.type === "toggle" && (
                      <Switch 
                        defaultChecked={item.value} 
                        data-testid={`switch-${item.id}`}
                      />
                    )}
                    {item.type === "link" && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </Card>
            </div>
          ))}

          <Card className="glass-card overflow-hidden">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-4 w-full hover-elevate text-destructive"
              data-testid="button-logout"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Log Out</div>
                <div className="text-sm text-muted-foreground">Sign out of your account</div>
              </div>
            </button>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-4" data-testid="text-app-version">
            <p>TradeFlow v1.0.0</p>
            <p className="text-xs mt-1">Made with care for traders</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
