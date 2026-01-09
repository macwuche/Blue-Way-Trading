import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Search, MoreVertical, CheckCircle2, XCircle, 
  Eye, Ban, Mail, Shield, Plus, Minus, Crown,
  DollarSign, TrendingUp, RefreshCw, UserCheck,
  Filter, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  vipLevel: string | null;
  isVerified: boolean | null;
  isAdmin: boolean | null;
  balance: string;
  totalProfit: string;
  createdAt: string | null;
}

type DialogType = "balance" | "profit" | "vip" | "details" | null;

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vipFilter, setVipFilter] = useState<string>("all");
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustOperation, setAdjustOperation] = useState<"add" | "subtract">("add");
  const [selectedVipLevel, setSelectedVipLevel] = useState<string>("");
  const { toast } = useToast();

  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users", debouncedSearch],
    queryFn: async () => {
      const url = debouncedSearch 
        ? `/api/admin/users?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/admin/users";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const filteredUsers = users.filter(user => {
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (vipFilter !== "all" && user.vipLevel !== vipFilter) return false;
    return true;
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Status Updated", description: "User status has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/verify`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Verification Updated", description: "User verification status has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update verification", variant: "destructive" });
    }
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, operation }: { userId: string; amount: number; operation: "add" | "subtract" }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/balance`, { amount, operation });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Balance Adjusted", description: "User balance has been updated" });
      setDialogType(null);
      setAdjustAmount("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to adjust balance", variant: "destructive" });
    }
  });

  const adjustProfitMutation = useMutation({
    mutationFn: async ({ userId, amount, operation }: { userId: string; amount: number; operation: "add" | "subtract" }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/profit`, { amount, operation });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Profit Adjusted", description: "User profit has been updated" });
      setDialogType(null);
      setAdjustAmount("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to adjust profit", variant: "destructive" });
    }
  });

  const updateVipMutation = useMutation({
    mutationFn: async ({ userId, vipLevel }: { userId: string; vipLevel: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/vip`, { vipLevel });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "VIP Level Updated", description: "User VIP level has been updated" });
      setDialogType(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update VIP level", variant: "destructive" });
    }
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-success/20 text-success";
      case "suspended": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getVipColor = (level: string | null) => {
    switch (level) {
      case "Diamond": return "bg-purple-500/20 text-purple-400";
      case "Platinum": return "bg-cyan-500/20 text-cyan-400";
      case "Gold": return "bg-yellow-500/20 text-yellow-400";
      case "Silver": return "bg-gray-400/20 text-gray-300";
      default: return "bg-orange-500/20 text-orange-400";
    }
  };

  const getUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "Unknown";
  };

  const getInitials = (user: User) => {
    const name = getUserName(user);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const openDialog = (type: DialogType, user: User) => {
    setSelectedUser(user);
    setDialogType(type);
    if (type === "vip") {
      setSelectedVipLevel(user.vipLevel || "Bronze");
    }
    setAdjustAmount("");
    setAdjustOperation("add");
  };

  const handleAdjustSubmit = () => {
    if (!selectedUser || !adjustAmount) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number", variant: "destructive" });
      return;
    }

    if (dialogType === "balance") {
      adjustBalanceMutation.mutate({ userId: selectedUser.id, amount, operation: adjustOperation });
    } else if (dialogType === "profit") {
      adjustProfitMutation.mutate({ userId: selectedUser.id, amount, operation: adjustOperation });
    }
  };

  const handleVipSubmit = () => {
    if (!selectedUser || !selectedVipLevel) return;
    updateVipMutation.mutate({ userId: selectedUser.id, vipLevel: selectedVipLevel });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage users, balances, and VIP levels</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-users">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={vipFilter} onValueChange={setVipFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-vip-filter">
              <Crown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="VIP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All VIP</SelectItem>
              <SelectItem value="Bronze">Bronze</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
              <SelectItem value="Platinum">Platinum</SelectItem>
              <SelectItem value="Diamond">Diamond</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card className="glass-card p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No users found</p>
        </Card>
      ) : (
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Balance</th>
                  <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">Profit</th>
                  <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground hidden lg:table-cell">VIP</th>
                  <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-border/20 hover:bg-muted/5"
                    data-testid={`row-user-${user.id}`}
                  >
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm flex items-center gap-1 sm:gap-2 truncate">
                            <span className="truncate">{getUserName(user)}</span>
                            {user.isVerified && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />}
                            {user.isAdmin && <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                            ${parseFloat(user.balance).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell">
                      <span className="font-medium text-sm">${parseFloat(user.balance).toLocaleString()}</span>
                    </td>
                    <td className="p-3 sm:p-4 hidden md:table-cell">
                      <span className={cn(
                        "font-medium text-sm",
                        parseFloat(user.totalProfit) >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {parseFloat(user.totalProfit) >= 0 ? "+" : ""}${parseFloat(user.totalProfit).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <Badge className={cn("text-xs", getStatusColor(user.status))}>
                        {(user.status || "active").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4 hidden lg:table-cell">
                      <Badge className={cn("text-xs", getVipColor(user.vipLevel))}>
                        {user.vipLevel || "Bronze"}
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-user-actions-${user.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-dark border-white/10 w-48">
                          <DropdownMenuItem onClick={() => openDialog("details", user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => openDialog("balance", user)}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog("profit", user)}>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Adjust Profit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog("vip", user)}>
                            <Crown className="w-4 h-4 mr-2" />
                            Change VIP Level
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => updateVerificationMutation.mutate({ 
                              userId: user.id, 
                              isVerified: !user.isVerified 
                            })}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {user.isVerified ? "Unverify Account" : "Verify Account"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={user.status === "suspended" ? "text-success" : "text-destructive"}
                            onClick={() => updateStatusMutation.mutate({ 
                              userId: user.id, 
                              status: user.status === "suspended" ? "active" : "suspended" 
                            })}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {user.status === "suspended" ? "Activate Account" : "Suspend Account"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={dialogType === "balance" || dialogType === "profit"} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "balance" ? "Adjust Balance" : "Adjust Profit"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "balance" 
                ? `Current balance: $${parseFloat(selectedUser?.balance || "0").toLocaleString()}`
                : `Current profit: $${parseFloat(selectedUser?.totalProfit || "0").toLocaleString()}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={adjustOperation === "add" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAdjustOperation("add")}
                data-testid="button-operation-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Button
                variant={adjustOperation === "subtract" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAdjustOperation("subtract")}
                data-testid="button-operation-subtract"
              >
                <Minus className="w-4 h-4 mr-2" />
                Subtract
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                data-testid="input-adjust-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button 
              onClick={handleAdjustSubmit}
              disabled={adjustBalanceMutation.isPending || adjustProfitMutation.isPending}
              data-testid="button-confirm-adjust"
            >
              {adjustBalanceMutation.isPending || adjustProfitMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "vip"} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Change VIP Level</DialogTitle>
            <DialogDescription>
              Current VIP level: {selectedUser?.vipLevel || "Bronze"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedVipLevel} onValueChange={setSelectedVipLevel}>
              <SelectTrigger data-testid="select-vip-level">
                <SelectValue placeholder="Select VIP Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
                <SelectItem value="Diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button 
              onClick={handleVipSubmit}
              disabled={updateVipMutation.isPending}
              data-testid="button-confirm-vip"
            >
              {updateVipMutation.isPending ? "Updating..." : "Update VIP Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "details"} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="glass-dark border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(selectedUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{getUserName(selectedUser)}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.phone && (
                    <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold">${parseFloat(selectedUser.balance).toLocaleString()}</p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Profit</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    parseFloat(selectedUser.totalProfit) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {parseFloat(selectedUser.totalProfit) >= 0 ? "+" : ""}${parseFloat(selectedUser.totalProfit).toLocaleString()}
                  </p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={cn("mt-1", getStatusColor(selectedUser.status))}>
                    {(selectedUser.status || "active").toUpperCase()}
                  </Badge>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">VIP Level</p>
                  <Badge className={cn("mt-1", getVipColor(selectedUser.vipLevel))}>
                    {selectedUser.vipLevel || "Bronze"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedUser.isVerified && (
                  <Badge className="bg-success/20 text-success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {selectedUser.isAdmin && (
                  <Badge className="bg-primary/20 text-primary">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              
              {selectedUser.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
