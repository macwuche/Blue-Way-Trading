import { useState } from "react";
import { 
  Shield, CheckCircle2, XCircle, Eye, Clock,
  FileText, Camera, Home, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface KycRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: "identity" | "selfie" | "address";
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
}

const mockKycRequests: KycRequest[] = [
  { id: "1", userId: "u1", userName: "John Trader", userEmail: "john@example.com", documentType: "identity", status: "pending", submittedAt: "2 hours ago" },
  { id: "2", userId: "u2", userName: "Sarah Crypto", userEmail: "sarah@example.com", documentType: "selfie", status: "pending", submittedAt: "5 hours ago" },
  { id: "3", userId: "u3", userName: "Mike Forex", userEmail: "mike@example.com", documentType: "address", status: "pending", submittedAt: "1 day ago" },
  { id: "4", userId: "u4", userName: "Emily Stocks", userEmail: "emily@example.com", documentType: "identity", status: "approved", submittedAt: "2 days ago", reviewedAt: "1 day ago" },
  { id: "5", userId: "u5", userName: "James Options", userEmail: "james@example.com", documentType: "selfie", status: "rejected", submittedAt: "3 days ago", reviewedAt: "2 days ago" },
];

export default function AdminKyc() {
  const [requests, setRequests] = useState(mockKycRequests);
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  const filteredRequests = requests.filter(r => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const getDocumentIcon = (type: KycRequest["documentType"]) => {
    switch (type) {
      case "identity": return CreditCard;
      case "selfie": return Camera;
      case "address": return Home;
    }
  };

  const getStatusColor = (status: KycRequest["status"]) => {
    switch (status) {
      case "approved": return "bg-success/20 text-success";
      case "rejected": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const handleApprove = (request: KycRequest) => {
    setRequests(prev => prev.map(r => 
      r.id === request.id ? { ...r, status: "approved" as const, reviewedAt: "Just now" } : r
    ));
  };

  const handleReject = () => {
    if (selectedRequest) {
      setRequests(prev => prev.map(r => 
        r.id === selectedRequest.id ? { ...r, status: "rejected" as const, reviewedAt: "Just now" } : r
      ));
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">KYC Verification</h2>
        <p className="text-muted-foreground">Review and approve user documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-light">
          <TabsTrigger value="pending" data-testid="tab-kyc-pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-kyc-approved">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-kyc-rejected">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-kyc-all">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const DocIcon = getDocumentIcon(request.documentType);
              return (
                <Card 
                  key={request.id} 
                  className="glass-card p-4"
                  data-testid={`card-kyc-${request.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {request.userName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{request.userName}</span>
                        <Badge className={cn("text-xs", getStatusColor(request.status))}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <DocIcon className="w-4 h-4" />
                        <span className="capitalize">{request.documentType} Document</span>
                        <span>-</span>
                        <span>{request.submittedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" data-testid={`button-view-doc-${request.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleApprove(request)}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewDialogOpen(true);
                            }}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Please provide a reason for rejecting this document. The user will receive this feedback.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason}
              data-testid="button-confirm-reject"
            >
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
