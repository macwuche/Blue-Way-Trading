import { useState } from "react";
import { 
  ArrowLeft, Wallet, Bitcoin, Building2, 
  Clock, CheckCircle2, AlertCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiPaypal, SiBitcoin, SiEthereum, SiTether } from "react-icons/si";

type WithdrawalMethod = "btc" | "eth" | "usdt" | "paypal" | "bank";

interface WithdrawalOption {
  id: WithdrawalMethod;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  minWithdrawal: string;
  fee: string;
  processingTime: string;
}

const withdrawalMethods: WithdrawalOption[] = [
  {
    id: "btc",
    name: "Bitcoin (BTC)",
    icon: SiBitcoin,
    color: "text-orange-500",
    minWithdrawal: "$50",
    fee: "0%",
    processingTime: "24-48 hours"
  },
  {
    id: "eth",
    name: "Ethereum (ETH)",
    icon: SiEthereum,
    color: "text-blue-400",
    minWithdrawal: "$50",
    fee: "0%",
    processingTime: "24-48 hours"
  },
  {
    id: "usdt",
    name: "Tether (USDT)",
    icon: SiTether,
    color: "text-green-500",
    minWithdrawal: "$20",
    fee: "0%",
    processingTime: "24-48 hours"
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: SiPaypal,
    color: "text-blue-600",
    minWithdrawal: "$20",
    fee: "2%",
    processingTime: "1-3 business days"
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: Building2,
    color: "text-gray-400",
    minWithdrawal: "$100",
    fee: "0%",
    processingTime: "3-5 business days"
  }
];

interface WithdrawalRequest {
  id: string;
  method: string;
  amount: string;
  status: "pending" | "approved" | "rejected" | "completed";
  timestamp: string;
}

const withdrawalHistory: WithdrawalRequest[] = [
  { id: "WD001", method: "Bitcoin", amount: "$500", status: "pending", timestamp: "1 hour ago" },
  { id: "WD002", method: "PayPal", amount: "$200", status: "completed", timestamp: "2 days ago" },
  { id: "WD003", method: "Bank Transfer", amount: "$1,000", status: "approved", timestamp: "3 days ago" },
];

export default function Withdrawal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  const balance = 10000;
  const selectedPayment = withdrawalMethods.find(m => m.id === selectedMethod);

  const handleSubmitWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to withdraw this amount",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Withdrawal Requested",
      description: "Your withdrawal request has been submitted for approval",
    });

    setWithdrawalAmount("");
    setWalletAddress("");
    setPaypalEmail("");
    setBankDetails("");
    setSelectedMethod(null);
  };

  const getStatusIcon = (status: WithdrawalRequest["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = (status: WithdrawalRequest["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success";
      case "approved":
        return "bg-primary/20 text-primary";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "rejected":
        return "bg-destructive/20 text-destructive";
    }
  };

  const isCrypto = selectedMethod === "btc" || selectedMethod === "eth" || selectedMethod === "usdt";

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-background to-background/95">
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
            <Send className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Withdrawal</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          {/* Balance Card */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="text-2xl font-bold text-success" data-testid="text-available-balance">
                    ${balance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Withdrawal Form */}
          <Card className="glass-card p-4 space-y-4">
            <h3 className="font-semibold">Request Withdrawal</h3>

            <div>
              <Label>Select Payment Method</Label>
              <Select value={selectedMethod || undefined} onValueChange={(v) => setSelectedMethod(v as WithdrawalMethod)}>
                <SelectTrigger className="mt-2" data-testid="select-withdrawal-method">
                  <SelectValue placeholder="Choose a method" />
                </SelectTrigger>
                <SelectContent>
                  {withdrawalMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <method.icon className={cn("w-4 h-4", method.color)} />
                        {method.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPayment && (
              <>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Minimum</div>
                    <div className="font-semibold">{selectedPayment.minWithdrawal}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fee</div>
                    <div className="font-semibold">{selectedPayment.fee}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Processing</div>
                    <div className="font-semibold text-xs">{selectedPayment.processingTime}</div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Withdrawal Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="mt-2"
                    data-testid="input-withdrawal-amount"
                  />
                </div>

                {isCrypto && (
                  <div>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input
                      id="wallet"
                      placeholder={`Enter your ${selectedPayment.name.split(' ')[0]} wallet address`}
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="mt-2 font-mono text-sm"
                      data-testid="input-wallet-address"
                    />
                  </div>
                )}

                {selectedMethod === "paypal" && (
                  <div>
                    <Label htmlFor="paypal">PayPal Email</Label>
                    <Input
                      id="paypal"
                      type="email"
                      placeholder="Enter your PayPal email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="mt-2"
                      data-testid="input-paypal-email"
                    />
                  </div>
                )}

                {selectedMethod === "bank" && (
                  <div>
                    <Label htmlFor="bank">Bank Details</Label>
                    <Textarea
                      id="bank"
                      placeholder="Enter bank name, account number, SWIFT/BIC code, etc."
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      className="mt-2"
                      data-testid="input-bank-details"
                    />
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-500">Withdrawal Notice</p>
                      <p className="text-muted-foreground">
                        All withdrawals require admin approval. Processing times may vary based on verification status.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSubmitWithdrawal}
                  disabled={!withdrawalAmount || (isCrypto && !walletAddress) || (selectedMethod === "paypal" && !paypalEmail) || (selectedMethod === "bank" && !bankDetails)}
                  data-testid="button-submit-withdrawal"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Withdrawal Request
                </Button>
              </>
            )}
          </Card>

          {/* Withdrawal History */}
          {withdrawalHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Withdrawal History</h3>
              <div className="space-y-2">
                {withdrawalHistory.map((withdrawal) => (
                  <Card 
                    key={withdrawal.id} 
                    className="glass-card p-4"
                    data-testid={`card-withdrawal-${withdrawal.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(withdrawal.status)}
                        <div>
                          <div className="font-medium">{withdrawal.amount}</div>
                          <div className="text-xs text-muted-foreground">
                            {withdrawal.method} - {withdrawal.timestamp}
                          </div>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(withdrawal.status))}>
                        {withdrawal.status.toUpperCase()}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <MobileBottomNav />
    </div>
  );
}
