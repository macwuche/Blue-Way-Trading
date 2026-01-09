import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2, XCircle, Clock, Eye, Search, Filter,
  Calendar, DollarSign, Download, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface Deposit {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  method: string;
  transactionId?: string;
  status: "pending" | "confirmed" | "rejected";
  note?: string;
  createdAt: string;
  updatedAt?: string;
  processedBy?: string;
  processedAt?: string;
  user?: User;
}

export default function AdminDeposits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [methodFilter, setMethodFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<Deposit | null>(null);
  const { toast } = useToast();

  const { data: deposits = [], isLoading, refetch } = useQuery<Deposit[]>({
    queryKey: ["/api/admin/deposits"],
  });

  const updateDepositMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/deposits/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const pendingCount = deposits.filter(d => d.status === "pending").length;
  const confirmedToday = deposits.filter(d => {
    if (d.status !== "confirmed") return false;
    const createdAt = new Date(d.createdAt);
    const now = new Date();
    return createdAt.toDateString() === now.toDateString();
  }).reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);
  const totalConfirmed = deposits.filter(d => d.status === "confirmed").reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);

  const filteredDeposits = deposits.filter(d => {
    const userName = `${d.user?.firstName || ""} ${d.user?.lastName || ""}`.toLowerCase();
    const userEmail = (d.user?.email || "").toLowerCase();
    const userPhone = d.user?.phone || "";
    
    const matchesSearch = 
      userName.includes(searchQuery.toLowerCase()) ||
      userEmail.includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userPhone.includes(searchQuery);
    
    const matchesMethod = methodFilter === "all" || d.method.toLowerCase() === methodFilter.toLowerCase();
    
    const amountUsd = parseFloat(d.amount || "0");
    let matchesAmount = true;
    if (amountFilter === "small") matchesAmount = amountUsd < 500;
    else if (amountFilter === "medium") matchesAmount = amountUsd >= 500 && amountUsd < 2000;
    else if (amountFilter === "large") matchesAmount = amountUsd >= 2000;
    
    const matchesStatus = activeTab === "all" || d.status === activeTab;
    
    return matchesSearch && matchesMethod && matchesAmount && matchesStatus;
  });

  const getStatusColor = (status: Deposit["status"]) => {
    switch (status) {
      case "confirmed": return "bg-success/20 text-success";
      case "rejected": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDepositMutation.mutateAsync({ id, status: "confirmed" });
      toast({ title: "Deposit Approved", description: "The deposit has been confirmed and added to user's balance" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve deposit", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDepositMutation.mutateAsync({ id, status: "rejected" });
      toast({ title: "Deposit Rejected", description: "The deposit has been rejected", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject deposit", variant: "destructive" });
    }
  };

  const exportToCsv = () => {
    const headers = ["ID", "User", "Email", "Phone", "Amount", "Currency", "Method", "Status", "Transaction ID", "Date"];
    const rows = filteredDeposits.map(d => [
      d.id, 
      `${d.user?.firstName || ""} ${d.user?.lastName || ""}`.trim() || "Unknown",
      d.user?.email || "", 
      d.user?.phone || "", 
      d.amount, 
      d.currency,
      d.method, 
      d.status, 
      d.transactionId || "", 
      d.createdAt
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deposits_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({ title: "Export Complete", description: "Deposits exported to CSV" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 60) return `${mins} mins ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Deposit Management</h2>
          <p className="text-sm text-muted-foreground">Review and approve deposit requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-deposits"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCsv} data-testid="button-export-deposits">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-deposits"
          />
        </div>
      </div>

      {showFilters && (
        <Card className="glass-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Payment Method</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger data-testid="select-method-filter">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                  <SelectItem value="Ethereum">Ethereum</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Amount Range</label>
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger data-testid="select-amount-filter">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Amounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="small">Under $500</SelectItem>
                  <SelectItem value="medium">$500 - $2,000</SelectItem>
                  <SelectItem value="large">Over $2,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{pendingCount}</p>
              )}
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-2xl font-bold">${confirmedToday.toLocaleString()}</p>
              )}
              <p className="text-sm text-muted-foreground">Confirmed Today</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">${totalConfirmed.toLocaleString()}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Confirmed</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-light">
          <TabsTrigger value="pending" data-testid="tab-deposits-pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-deposits-confirmed">
            Confirmed
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-deposits-rejected">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-deposits-all">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <Card className="glass-card p-4">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </Card>
          ) : filteredDeposits.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground">No deposits match your filters</p>
            </Card>
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">Time</th>
                      <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposits.map((deposit) => (
                      <tr 
                        key={deposit.id} 
                        className="border-b border-border/20 hover:bg-muted/5"
                        data-testid={`row-deposit-${deposit.id}`}
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(deposit.user?.firstName?.[0] || "") + (deposit.user?.lastName?.[0] || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {deposit.user?.firstName || ""} {deposit.user?.lastName || ""}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{deposit.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div>
                            <span className="font-semibold text-sm">${parseFloat(deposit.amount).toLocaleString()}</span>
                            <div className="text-xs text-muted-foreground">{deposit.currency}</div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 hidden sm:table-cell">
                          <span className="text-sm">{deposit.method}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <Badge className={cn("text-xs", getStatusColor(deposit.status))}>
                            {deposit.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 sm:p-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{formatDate(deposit.createdAt)}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {deposit.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-success hover:bg-success/90 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                                  onClick={() => handleApprove(deposit.id)}
                                  disabled={updateDepositMutation.isPending}
                                  data-testid={`button-approve-deposit-${deposit.id}`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                                  onClick={() => handleReject(deposit.id)}
                                  disabled={updateDepositMutation.isPending}
                                  data-testid={`button-reject-deposit-${deposit.id}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setDetailsDialog(deposit)}
                              data-testid={`button-view-deposit-${deposit.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailsDialog} onOpenChange={() => setDetailsDialog(null)}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
          </DialogHeader>
          {detailsDialog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Deposit ID</p>
                  <p className="font-mono font-medium text-sm truncate">{detailsDialog.id}</p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={cn("mt-1", getStatusColor(detailsDialog.status))}>
                    {detailsDialog.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="font-medium">{detailsDialog.user?.firstName} {detailsDialog.user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{detailsDialog.user?.email}</p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{detailsDialog.user?.phone || "Not provided"}</p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg">${parseFloat(detailsDialog.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{detailsDialog.currency}</p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="font-medium">{detailsDialog.method}</p>
                </div>
              </div>
              {detailsDialog.transactionId && (
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm break-all">{detailsDialog.transactionId}</p>
                </div>
              )}
              <div className="glass-light p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-medium">{formatDate(detailsDialog.createdAt)}</p>
                <p className="text-xs text-muted-foreground">{new Date(detailsDialog.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(null)}>Close</Button>
            {detailsDialog?.status === "pending" && (
              <>
                <Button 
                  className="bg-success hover:bg-success/90"
                  onClick={() => {
                    handleApprove(detailsDialog.id);
                    setDetailsDialog(null);
                  }}
                  disabled={updateDepositMutation.isPending}
                >
                  Approve
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleReject(detailsDialog.id);
                    setDetailsDialog(null);
                  }}
                  disabled={updateDepositMutation.isPending}
                >
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
