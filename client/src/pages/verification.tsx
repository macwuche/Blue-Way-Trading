import { useState } from "react";
import { 
  ArrowLeft, Shield, Upload, CheckCircle2, Clock, 
  AlertCircle, FileText, Camera, CreditCard, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  status: "pending" | "uploaded" | "verified" | "rejected";
  required: boolean;
}

const verificationSteps: VerificationStep[] = [
  {
    id: "identity",
    title: "Government ID",
    description: "Upload a valid passport, driver's license, or national ID card",
    icon: CreditCard,
    status: "pending",
    required: true
  },
  {
    id: "selfie",
    title: "Selfie Verification",
    description: "Take a selfie holding your ID document",
    icon: Camera,
    status: "pending",
    required: true
  },
  {
    id: "address",
    title: "Proof of Address",
    description: "Upload a utility bill or bank statement (less than 3 months old)",
    icon: Home,
    status: "pending",
    required: true
  }
];

export default function Verification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [steps, setSteps] = useState(verificationSteps);
  const [uploadingStep, setUploadingStep] = useState<string | null>(null);

  const completedSteps = steps.filter(s => s.status === "verified" || s.status === "uploaded").length;
  const progress = (completedSteps / steps.length) * 100;

  const getStatusIcon = (status: VerificationStep["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "uploaded":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Upload className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: VerificationStep["status"]) => {
    switch (status) {
      case "verified":
        return { text: "Verified", color: "bg-success/20 text-success" };
      case "uploaded":
        return { text: "Under Review", color: "bg-yellow-500/20 text-yellow-500" };
      case "rejected":
        return { text: "Rejected", color: "bg-destructive/20 text-destructive" };
      default:
        return { text: "Required", color: "bg-muted text-muted-foreground" };
    }
  };

  const handleUpload = (stepId: string) => {
    setUploadingStep(stepId);
    
    setTimeout(() => {
      setSteps(prev => prev.map(step => 
        step.id === stepId ? { ...step, status: "uploaded" as const } : step
      ));
      setUploadingStep(null);
      toast({
        title: "Document Uploaded",
        description: "Your document has been submitted for review",
      });
    }, 1500);
  };

  const isFullyVerified = steps.every(s => s.status === "verified");
  const hasPendingReview = steps.some(s => s.status === "uploaded");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/more")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Account Verification</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          {/* Status Card */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center",
                isFullyVerified 
                  ? "bg-gradient-to-br from-success/20 to-green-500/20" 
                  : "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
              )}>
                <Shield className={cn(
                  "w-8 h-8",
                  isFullyVerified ? "text-success" : "text-yellow-500"
                )} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {isFullyVerified ? "Fully Verified" : hasPendingReview ? "Under Review" : "Verification Required"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isFullyVerified 
                    ? "Your account is verified. Enjoy full access to all features."
                    : hasPendingReview
                    ? "Your documents are being reviewed. This usually takes 24-48 hours."
                    : "Complete verification to unlock higher limits and faster withdrawals"}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verification Progress</span>
                <span className="font-medium">{completedSteps}/{steps.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>

          {/* Benefits Card */}
          <Card className="glass-card p-4">
            <h3 className="font-semibold mb-3">Verification Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Higher withdrawal limits</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Faster processing times</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Priority support access</span>
              </div>
            </div>
          </Card>

          {/* Verification Steps */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Documents</h3>
            <div className="space-y-3">
              {steps.map((step) => {
                const statusInfo = getStatusText(step.status);
                const isUploading = uploadingStep === step.id;
                
                return (
                  <Card 
                    key={step.id}
                    className={cn(
                      "glass-card p-4",
                      step.status === "rejected" && "border border-destructive/50"
                    )}
                    data-testid={`card-verification-${step.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        step.status === "verified" ? "bg-success/20" :
                        step.status === "uploaded" ? "bg-yellow-500/20" :
                        step.status === "rejected" ? "bg-destructive/20" :
                        "bg-muted/20"
                      )}>
                        {getStatusIcon(step.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold">{step.title}</h4>
                          <Badge className={cn("text-xs", statusInfo.color)}>
                            {statusInfo.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        
                        {step.status === "rejected" && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 mb-3">
                            <p className="text-sm text-destructive">
                              Document rejected. Please upload a clearer image.
                            </p>
                          </div>
                        )}
                        
                        {(step.status === "pending" || step.status === "rejected") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpload(step.id)}
                            disabled={isUploading}
                            data-testid={`button-upload-${step.id}`}
                          >
                            {isUploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Help Card */}
          <Card className="glass-card p-4">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              If you're having trouble with verification, our support team is here to help.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/support")}
              data-testid="button-contact-support"
            >
              Contact Support
            </Button>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
