import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Shield,
  CheckCircle2,
  XCircle,
  User,
  Smartphone,
  FileCheck,
  Crown,
  Ban,
  ArrowDownCircle,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Send,
  BellRing,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  XOctagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  profileImageUrl: string | null;
  status: string | null;
  vipLevel: string | null;
  isVerified: boolean | null;
  emailVerified: boolean | null;
  twoFactorEnabled: boolean | null;
  kycVerified: boolean | null;
  isAdmin: boolean | null;
  createdAt: string | null;
  balance: string;
  totalProfit: string;
  totalTransactions: number;
  totalWithdrawals: string;
  totalReferrals: number;
  trades: Trade[];
  adminTrades: AdminTrade[];
}

interface Trade {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  type: string;
  quantity: string;
  price: string;
  total: string;
  status: string;
  createdAt: string;
}

interface AdminTrade {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  direction: string;
  amount: string;
  entryPrice: string;
  exitPrice: string | null;
  profit: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "error">("info");

  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/admin/users", userId, "profile"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/profile`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return res.json();
    },
    enabled: !!userId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/status`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "profile"] });
      toast({ title: "Status Updated", description: "User status has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async (data: { field: string; value: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/verification`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "profile"] });
      toast({ title: "Verification Updated", description: "User verification status has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update verification", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/send-email`, data);
    },
    onSuccess: () => {
      toast({ title: "Email Sent", description: "Email has been sent to the user" });
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; type: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/send-notification`, data);
    },
    onSuccess: () => {
      toast({ title: "Notification Sent", description: "Push notification has been sent to the user" });
      setNotifDialogOpen(false);
      setNotifTitle("");
      setNotifMessage("");
      setNotifType("info");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    },
  });

  const getInitials = (user: UserProfile | undefined) => {
    if (!user) return "?";
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
  };

  const getUserName = (user: UserProfile | undefined) => {
    if (!user) return "Unknown User";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "Unknown User";
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-success/20 text-success";
      case "suspended": return "bg-destructive/20 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getVipColor = (level: string | null) => {
    switch (level) {
      case "Diamond": return "bg-purple-500/20 text-purple-400";
      case "Platinum": return "bg-blue-400/20 text-blue-300";
      case "Gold": return "bg-yellow-500/20 text-yellow-400";
      case "Silver": return "bg-gray-400/20 text-gray-300";
      default: return "bg-orange-600/20 text-orange-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/users")}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/users")}
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">User Profile</h1>
          <p className="text-sm text-muted-foreground">View and manage user details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={getUserName(user)} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{getUserName(user)}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(user.status)} data-testid="badge-status">
                  {(user.status || "active").toUpperCase()}
                </Badge>
                <Badge className={getVipColor(user.vipLevel)} data-testid="badge-vip">
                  <Crown className="w-3 h-3 mr-1" />
                  {user.vipLevel || "Bronze"}
                </Badge>
              </div>
              {user.isAdmin && (
                <Badge className="bg-primary/20 text-primary mt-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.country && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{user.country}</span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Controls
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="user-status" className="text-sm">User Status</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs",
                    user.status === "active" ? "text-success" : "text-destructive"
                  )}>
                    {user.status === "active" ? "Active" : "Banned"}
                  </span>
                  <Switch
                    id="user-status"
                    checked={user.status === "active"}
                    onCheckedChange={(checked) => {
                      updateStatusMutation.mutate({ status: checked ? "active" : "suspended" });
                    }}
                    data-testid="switch-user-status"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="email-verified" className="text-sm">Email Verification</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs",
                    user.emailVerified ? "text-success" : "text-muted-foreground"
                  )}>
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </span>
                  <Switch
                    id="email-verified"
                    checked={user.emailVerified || false}
                    onCheckedChange={(checked) => {
                      updateVerificationMutation.mutate({ field: "emailVerified", value: checked });
                    }}
                    data-testid="switch-email-verified"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="2fa-enabled" className="text-sm">2FA Verification</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs",
                    user.twoFactorEnabled ? "text-success" : "text-muted-foreground"
                  )}>
                    {user.twoFactorEnabled ? "Verified" : "Unverified"}
                  </span>
                  <Switch
                    id="2fa-enabled"
                    checked={user.twoFactorEnabled || false}
                    onCheckedChange={(checked) => {
                      updateVerificationMutation.mutate({ field: "twoFactorEnabled", value: checked });
                    }}
                    data-testid="switch-2fa"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="kyc-verified" className="text-sm">KYC Verification</Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs",
                    user.kycVerified ? "text-success" : "text-muted-foreground"
                  )}>
                    {user.kycVerified ? "Verified" : "Unverified"}
                  </span>
                  <Switch
                    id="kyc-verified"
                    checked={user.kycVerified || false}
                    onCheckedChange={(checked) => {
                      updateVerificationMutation.mutate({ field: "kycVerified", value: checked });
                    }}
                    data-testid="switch-kyc"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Send className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
                data-testid="button-send-email"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                Send Email
              </Button>
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => setNotifDialogOpen(true)}
                data-testid="button-send-notification"
              >
                <BellRing className="w-4 h-4 text-yellow-400" />
                Push Notification
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold" data-testid="text-balance">
                    ${parseFloat(user.balance || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  parseFloat(user.totalProfit || "0") >= 0 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  <TrendingUp className={cn(
                    "w-5 h-5",
                    parseFloat(user.totalProfit || "0") >= 0 ? "text-success" : "text-destructive"
                  )} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={cn(
                    "text-lg font-bold",
                    parseFloat(user.totalProfit || "0") >= 0 ? "text-success" : "text-destructive"
                  )} data-testid="text-profit">
                    {parseFloat(user.totalProfit || "0") >= 0 ? "+" : ""}
                    ${parseFloat(user.totalProfit || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trades</p>
                  <p className="text-lg font-bold" data-testid="text-transactions">
                    {user.totalTransactions || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Withdrawals</p>
                  <p className="text-lg font-bold" data-testid="text-withdrawals">
                    ${parseFloat(user.totalWithdrawals || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                  <p className="text-lg font-bold" data-testid="text-referrals">
                    {user.totalReferrals || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Trades (Admin)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/trades")}
                className="text-xs"
                data-testid="button-view-all-trades"
              >
                View All
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Asset</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Direction</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Profit</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.adminTrades && user.adminTrades.length > 0 ? (
                    user.adminTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-admin-trade-${trade.id}`}>
                        <td className="py-3 px-2 text-sm">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                              {trade.symbol.substring(0, 2)}
                            </div>
                            <span className="text-sm font-medium">{trade.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={cn(
                            "text-xs",
                            trade.direction === "higher" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          )}>
                            {trade.direction === "higher" ? (
                              <><ArrowUpRight className="w-3 h-3 mr-1" />HIGHER</>
                            ) : (
                              <><ArrowDownRight className="w-3 h-3 mr-1" />LOWER</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-medium">
                          ${parseFloat(trade.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {trade.profit ? (
                            <span className={cn(
                              "text-sm font-medium",
                              parseFloat(trade.profit) >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {parseFloat(trade.profit) >= 0 ? "+" : ""}${parseFloat(trade.profit).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge className={cn(
                            "text-xs",
                            trade.status === "closed" ? "bg-success/20 text-success" : 
                            trade.status === "active" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                          )}>
                            {trade.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No admin trades for this user
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="glass-card p-4 sm:p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Trade History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Asset</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.trades && user.trades.length > 0 ? (
                    user.trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2 text-sm">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs text-white font-bold">
                              {trade.symbol.substring(0, 2)}
                            </div>
                            <span className="text-sm font-medium">{trade.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={cn(
                            "text-xs",
                            trade.type === "buy" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          )}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-medium">
                          ${parseFloat(trade.total).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge className={cn(
                            "text-xs",
                            trade.status === "completed" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                          )}>
                            {trade.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No trade history
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="glass-dark border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Send Email to {getUserName(user)}
            </DialogTitle>
            <DialogDescription>
              This will send an email to {user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Enter email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Enter your message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={5}
                data-testid="input-email-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} data-testid="button-cancel-email">
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate({ subject: emailSubject, message: emailMessage })}
              disabled={!emailSubject.trim() || !emailMessage.trim() || sendEmailMutation.isPending}
              data-testid="button-confirm-send-email"
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
        <DialogContent className="glass-dark border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-yellow-400" />
              Push Notification to {getUserName(user)}
            </DialogTitle>
            <DialogDescription>
              This notification will appear instantly on the user's dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notif-type">Type</Label>
              <Select value={notifType} onValueChange={(v) => setNotifType(v as any)}>
                <SelectTrigger data-testid="select-notif-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <span className="flex items-center gap-2"><Info className="w-3 h-3 text-blue-400" /> Info</span>
                  </SelectItem>
                  <SelectItem value="success">
                    <span className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-400" /> Success</span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-400" /> Warning</span>
                  </SelectItem>
                  <SelectItem value="error">
                    <span className="flex items-center gap-2"><XOctagon className="w-3 h-3 text-red-400" /> Error</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                placeholder="Notification title..."
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                data-testid="input-notif-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                placeholder="Notification message..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                rows={3}
                data-testid="input-notif-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifDialogOpen(false)} data-testid="button-cancel-notif">
              Cancel
            </Button>
            <Button
              onClick={() => sendNotificationMutation.mutate({ title: notifTitle, message: notifMessage, type: notifType })}
              disabled={!notifTitle.trim() || !notifMessage.trim() || sendNotificationMutation.isPending}
              data-testid="button-confirm-send-notif"
            >
              {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
              <BellRing className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
