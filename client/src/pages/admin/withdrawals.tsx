import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2, XCircle, Clock, Eye, Search, AlertCircle,
  Filter, DollarSign, Download, RefreshCw
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
import { Textarea } from "@/components/ui/textarea";
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

interface Withdrawal {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  method: string;
  destination: string;
  status: "pending" | "approved" | "completed" | "rejected";
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  processedBy?: string;
  processedAt?: string;
  user?: User;
}

export default function AdminWithdrawals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [methodFilter, setMethodFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<Withdrawal | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  const { data: withdrawals = [], isLoading, refetch } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      return apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + parseFloat(w.amount || "0"), 0);
  const processedTotal = withdrawals.filter(w => w.status === "completed").reduce((sum, w) => sum + parseFloat(w.amount || "0"), 0);

  const filteredWithdrawals = withdrawals.filter(w => {
    const userName = `${w.user?.firstName || ""} ${w.user?.lastName || ""}`.toLowerCase();
    const userEmail = (w.user?.email || "").toLowerCase();
    const userPhone = w.user?.phone || "";
    
    const matchesSearch = 
      userName.includes(searchQuery.toLowerCase()) ||
      userEmail.includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userPhone.includes(searchQuery);
    
    const matchesMethod = methodFilter === "all" || w.method.toLowerCase() === methodFilter.toLowerCase();
    
    const amountUsd = parseFloat(w.amount || "0");
    let matchesAmount = true;
    if (amountFilter === "small") matchesAmount = amountUsd < 500;
    else if (amountFilter === "medium") matchesAmount = amountUsd >= 500 && amountUsd < 2000;
    else if (amountFilter === "large") matchesAmount = amountUsd >= 2000;
    
    const matchesStatus = activeTab === "all" || w.status === activeTab;
    
    return matchesSearch && matchesMethod && matchesAmount && matchesStatus;
  });

  const getStatusColor = (status: Withdrawal["status"]) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success";
      case "approved": return "bg-primary/20 text-primary";
      case "rejected": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateWithdrawalMutation.mutateAsync({ id, status: "approved" });
      toast({ title: "Withdrawal Approved", description: "The withdrawal has been approved for processing" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve withdrawal", variant: "destructive" });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateWithdrawalMutation.mutateAsync({ id, status: "completed" });
      toast({ title: "Withdrawal Completed", description: "The withdrawal has been marked as completed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete withdrawal", variant: "destructive" });
    }
  };

  const handleOpenRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (selectedWithdrawal) {
      try {
        await updateWithdrawalMutation.mutateAsync({ 
          id: selectedWithdrawal.id, 
          status: "rejected", 
          rejectionReason 
        });
        setRejectDialogOpen(false);
        setSelectedWithdrawal(null);
        setRejectionReason("");
        toast({ title: "Withdrawal Rejected", description: "The withdrawal has been rejected and funds returned to user", variant: "destructive" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to reject withdrawal", variant: "destructive" });
      }
    }
  };

  const exportToCsv = () => {
    const headers = ["ID", "User", "Email", "Phone", "Amount", "Currency", "Method", "Destination", "Status", "Date"];
    const rows = filteredWithdrawals.map(w => [
      w.id, 
      `${w.user?.firstName || ""} ${w.user?.lastName || ""}`.trim() || "Unknown",
      w.user?.email || "", 
      w.user?.phone || "", 
      w.amount, 
      w.currency,
      w.method, 
      w.destination,
      w.status, 
      w.createdAt
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawals_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({ title: "Export Complete", description: "Withdrawals exported to CSV" });
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
          <h2 className="text-xl sm:text-2xl font-bold">Withdrawal Management</h2>
          <p className="text-sm text-muted-foreground">Process withdrawal requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-withdrawals"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCsv} data-testid="button-export-withdrawals">
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
            data-testid="input-search-withdrawals"
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
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-2xl font-bold">${pendingAmount.toLocaleString()}</p>
              )}
              <p className="text-sm text-muted-foreground">Pending Amount</p>
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
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">${processedTotal.toLocaleString()}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Processed</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-light flex-wrap">
          <TabsTrigger value="pending" data-testid="tab-withdrawals-pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-withdrawals-approved">
            Approved
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-withdrawals-completed">
            Completed
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-withdrawals-rejected">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-withdrawals-all">
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
          ) : filteredWithdrawals.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground">No withdrawals match your filters</p>
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
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr 
                        key={withdrawal.id} 
                        className="border-b border-border/20 hover:bg-muted/5"
                        data-testid={`row-withdrawal-${withdrawal.id}`}
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(withdrawal.user?.firstName?.[0] || "") + (withdrawal.user?.lastName?.[0] || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {withdrawal.user?.firstName || ""} {withdrawal.user?.lastName || ""}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{withdrawal.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="font-semibold text-sm text-destructive">${parseFloat(withdrawal.amount).toLocaleString()}</span>
                        </td>
                        <td className="p-3 sm:p-4 hidden sm:table-cell">
                          <span className="text-sm">{withdrawal.method}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <Badge className={cn("text-xs", getStatusColor(withdrawal.status))}>
                            {withdrawal.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 sm:p-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{formatDate(withdrawal.createdAt)}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {withdrawal.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-success hover:bg-success/90 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                                  onClick={() => handleApprove(withdrawal.id)}
                                  disabled={updateWithdrawalMutation.isPending}
                                  data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                                  onClick={() => handleOpenRejectDialog(withdrawal)}
                                  disabled={updateWithdrawalMutation.isPending}
                                  data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {withdrawal.status === "approved" && (
                              <Button 
                                size="sm" 
                                className="bg-success hover:bg-success/90"
                                onClick={() => handleComplete(withdrawal.id)}
                                disabled={updateWithdrawalMutation.isPending}
                                data-testid={`button-complete-withdrawal-${withdrawal.id}`}
                              >
                                Complete
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setDetailsDialog(withdrawal)}
                              data-testid={`button-view-withdrawal-${withdrawal.id}`}
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

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Please provide a reason for rejecting this withdrawal request. The funds will be returned to the user's balance.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              data-testid="input-withdrawal-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason || updateWithdrawalMutation.isPending}
              data-testid="button-confirm-reject-withdrawal"
            >
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailsDialog} onOpenChange={() => setDetailsDialog(null)}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {detailsDialog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Withdrawal ID</p>
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
                  <p className="font-medium text-lg text-destructive">${parseFloat(detailsDialog.amount).toLocaleString()}</p>
                </div>
                <div className="glass-light p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="font-medium">{detailsDialog.method}</p>
                </div>
              </div>
              <div className="glass-light p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="font-mono text-sm break-all">{detailsDialog.destination}</p>
              </div>
              {detailsDialog.rejectionReason && (
                <div className="glass-light p-3 rounded-lg border border-destructive/20">
                  <p className="text-xs text-destructive">Rejection Reason</p>
                  <p className="text-sm">{detailsDialog.rejectionReason}</p>
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
                  disabled={updateWithdrawalMutation.isPending}
                >
                  Approve
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleOpenRejectDialog(detailsDialog);
                    setDetailsDialog(null);
                  }}
                  disabled={updateWithdrawalMutation.isPending}
                >
                  Reject
                </Button>
              </>
            )}
            {detailsDialog?.status === "approved" && (
              <Button 
                className="bg-success hover:bg-success/90"
                onClick={() => {
                  handleComplete(detailsDialog.id);
                  setDetailsDialog(null);
                }}
                disabled={updateWithdrawalMutation.isPending}
              >
                Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
