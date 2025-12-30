import { useState } from "react";
import { 
  CheckCircle2, XCircle, Clock, Eye, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Deposit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: string;
  method: string;
  status: "pending" | "confirmed" | "rejected";
  transactionId?: string;
  submittedAt: string;
}

const mockDeposits: Deposit[] = [
  { id: "D001", userId: "u1", userName: "John Trader", userEmail: "john@example.com", amount: "0.05 BTC", method: "Bitcoin", status: "pending", transactionId: "bc1...xyz", submittedAt: "30 mins ago" },
  { id: "D002", userId: "u2", userName: "Sarah Crypto", userEmail: "sarah@example.com", amount: "500 USDT", method: "Tether", status: "pending", transactionId: "TJY...abc", submittedAt: "2 hours ago" },
  { id: "D003", userId: "u3", userName: "Mike Forex", userEmail: "mike@example.com", amount: "$250", method: "PayPal", status: "pending", submittedAt: "4 hours ago" },
  { id: "D004", userId: "u4", userName: "Emily Stocks", userEmail: "emily@example.com", amount: "1 ETH", method: "Ethereum", status: "confirmed", transactionId: "0x71...def", submittedAt: "1 day ago" },
  { id: "D005", userId: "u5", userName: "James Options", userEmail: "james@example.com", amount: "$100", method: "PayPal", status: "rejected", submittedAt: "2 days ago" },
];

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState(mockDeposits);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const pendingCount = deposits.filter(d => d.status === "pending").length;

  const filteredDeposits = deposits.filter(d => {
    const matchesSearch = d.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return d.status === activeTab && matchesSearch;
  });

  const getStatusColor = (status: Deposit["status"]) => {
    switch (status) {
      case "confirmed": return "bg-success/20 text-success";
      case "rejected": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const handleApprove = (id: string) => {
    setDeposits(prev => prev.map(d => 
      d.id === id ? { ...d, status: "confirmed" as const } : d
    ));
  };

  const handleReject = (id: string) => {
    setDeposits(prev => prev.map(d => 
      d.id === id ? { ...d, status: "rejected" as const } : d
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Deposit Management</h2>
          <p className="text-muted-foreground">Review and approve deposit requests</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deposits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
            data-testid="input-search-deposits"
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
              <p className="text-2xl font-bold">$24,580</p>
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
              <p className="text-2xl font-bold">$1.2M</p>
              <p className="text-sm text-muted-foreground">Total This Month</p>
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
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Method</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map((deposit) => (
                    <tr 
                      key={deposit.id} 
                      className="border-b border-border/20 hover:bg-muted/5"
                      data-testid={`row-deposit-${deposit.id}`}
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm">{deposit.id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {deposit.userName.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{deposit.userName}</div>
                            <div className="text-xs text-muted-foreground">{deposit.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{deposit.amount}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{deposit.method}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={cn("text-xs", getStatusColor(deposit.status))}>
                          {deposit.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{deposit.submittedAt}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {deposit.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-success hover:bg-success/90"
                                onClick={() => handleApprove(deposit.id)}
                                data-testid={`button-approve-deposit-${deposit.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(deposit.id)}
                                data-testid={`button-reject-deposit-${deposit.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" data-testid={`button-view-deposit-${deposit.id}`}>
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
    </div>
  );
}
