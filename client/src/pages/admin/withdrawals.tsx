import { useState } from "react";
import { 
  CheckCircle2, XCircle, Clock, Eye, Search, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: string;
  method: string;
  destination: string;
  status: "pending" | "approved" | "completed" | "rejected";
  submittedAt: string;
}

const mockWithdrawals: Withdrawal[] = [
  { id: "W001", userId: "u1", userName: "John Trader", userEmail: "john@example.com", amount: "$500", method: "Bitcoin", destination: "bc1q...abc", status: "pending", submittedAt: "1 hour ago" },
  { id: "W002", userId: "u2", userName: "Sarah Crypto", userEmail: "sarah@example.com", amount: "$1,200", method: "PayPal", destination: "sarah@paypal.com", status: "pending", submittedAt: "3 hours ago" },
  { id: "W003", userId: "u3", userName: "Mike Forex", userEmail: "mike@example.com", amount: "$800", method: "Bank Transfer", destination: "****1234", status: "approved", submittedAt: "1 day ago" },
  { id: "W004", userId: "u4", userName: "Emily Stocks", userEmail: "emily@example.com", amount: "$350", method: "USDT", destination: "TJY...xyz", status: "completed", submittedAt: "2 days ago" },
  { id: "W005", userId: "u5", userName: "James Options", userEmail: "james@example.com", amount: "$2,000", method: "Bitcoin", destination: "bc1q...def", status: "rejected", submittedAt: "3 days ago" },
];

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingAmount = "$45,230";

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return w.status === activeTab && matchesSearch;
  });

  const getStatusColor = (status: Withdrawal["status"]) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success";
      case "approved": return "bg-primary/20 text-primary";
      case "rejected": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const handleApprove = (id: string) => {
    setWithdrawals(prev => prev.map(w => 
      w.id === id ? { ...w, status: "approved" as const } : w
    ));
  };

  const handleOpenRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (selectedWithdrawal) {
      setWithdrawals(prev => prev.map(w => 
        w.id === selectedWithdrawal.id ? { ...w, status: "rejected" as const } : w
      ));
      setRejectDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectionReason("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Withdrawal Management</h2>
          <p className="text-muted-foreground">Process withdrawal requests</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search withdrawals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
            data-testid="input-search-withdrawals"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
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
              <p className="text-2xl font-bold">{pendingAmount}</p>
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
              <p className="text-2xl font-bold">$890K</p>
              <p className="text-sm text-muted-foreground">Processed This Month</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-light">
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
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Method</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Destination</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr 
                      key={withdrawal.id} 
                      className="border-b border-border/20 hover:bg-muted/5"
                      data-testid={`row-withdrawal-${withdrawal.id}`}
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm">{withdrawal.id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {withdrawal.userName.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{withdrawal.userName}</div>
                            <div className="text-xs text-muted-foreground">{withdrawal.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-destructive">{withdrawal.amount}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{withdrawal.method}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-muted-foreground">{withdrawal.destination}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={cn("text-xs", getStatusColor(withdrawal.status))}>
                          {withdrawal.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {withdrawal.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-success hover:bg-success/90"
                                onClick={() => handleApprove(withdrawal.id)}
                                data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleOpenRejectDialog(withdrawal)}
                                data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" data-testid={`button-view-withdrawal-${withdrawal.id}`}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Please provide a reason for rejecting this withdrawal request.
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
              disabled={!rejectionReason}
              data-testid="button-confirm-reject-withdrawal"
            >
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
