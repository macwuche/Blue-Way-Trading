import { useState } from "react";
import { 
  ArrowLeft, Wallet, Bitcoin, CreditCard, Building2, 
  Copy, CheckCircle2, Clock, AlertCircle, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SiPaypal, SiBitcoin, SiEthereum, SiTether } from "react-icons/si";

type PaymentMethod = "btc" | "eth" | "usdt" | "paypal" | "bank";

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  minDeposit: string;
  fee: string;
  processingTime: string;
  walletAddress?: string;
}

const paymentMethods: PaymentOption[] = [
  {
    id: "btc",
    name: "Bitcoin (BTC)",
    description: "Deposit using Bitcoin",
    icon: SiBitcoin,
    color: "text-orange-500",
    minDeposit: "0.001 BTC",
    fee: "0%",
    processingTime: "10-30 minutes",
    walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  },
  {
    id: "eth",
    name: "Ethereum (ETH)",
    description: "Deposit using Ethereum",
    icon: SiEthereum,
    color: "text-blue-400",
    minDeposit: "0.01 ETH",
    fee: "0%",
    processingTime: "5-15 minutes",
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
  },
  {
    id: "usdt",
    name: "Tether (USDT)",
    description: "Deposit using USDT (TRC20)",
    icon: SiTether,
    color: "text-green-500",
    minDeposit: "$10",
    fee: "0%",
    processingTime: "5-10 minutes",
    walletAddress: "TJYeasTPa6gpEh5M6J6V1qLPKXdJ9XwVXK"
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Deposit using PayPal",
    icon: SiPaypal,
    color: "text-blue-600",
    minDeposit: "$10",
    fee: "2.5%",
    processingTime: "Instant"
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Deposit via bank wire",
    icon: Building2,
    color: "text-gray-400",
    minDeposit: "$100",
    fee: "0%",
    processingTime: "1-3 business days"
  }
];

interface PendingDeposit {
  id: string;
  method: string;
  amount: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
}

const pendingDeposits: PendingDeposit[] = [
  { id: "DEP001", method: "Bitcoin", amount: "0.05 BTC", status: "pending", timestamp: "2 hours ago" },
  { id: "DEP002", method: "USDT", amount: "500 USDT", status: "confirmed", timestamp: "1 day ago" },
];

export default function Deposit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedPayment = paymentMethods.find(m => m.id === selectedMethod);

  const handleCopyAddress = () => {
    if (selectedPayment?.walletAddress) {
      navigator.clipboard.writeText(selectedPayment.walletAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = (status: PendingDeposit["status"]) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = (status: PendingDeposit["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-success/20 text-success";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "failed":
        return "bg-destructive/20 text-destructive";
    }
  };

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
            <Wallet className="w-5 h-5 text-success" />
            <h1 className="text-lg font-semibold">Deposit</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          {/* Balance Card */}
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-success/20 to-green-500/20 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Add Funds</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a payment method to deposit
                </p>
              </div>
            </div>
          </Card>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Methods</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={cn(
                    "glass-card p-4 cursor-pointer transition-all",
                    selectedMethod === method.id 
                      ? "ring-2 ring-primary" 
                      : "hover-elevate"
                  )}
                  onClick={() => setSelectedMethod(method.id)}
                  data-testid={`card-payment-${method.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center", method.color)}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{method.name}</div>
                      <div className="text-sm text-muted-foreground">{method.description}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Min: {method.minDeposit}</div>
                      <div className="text-muted-foreground">Fee: {method.fee}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Method Details */}
          {selectedPayment && (
            <Card className="glass-card p-4 space-y-4" data-testid="deposit-details">
              <h3 className="font-semibold flex items-center gap-2">
                <selectedPayment.icon className={cn("w-5 h-5", selectedPayment.color)} />
                Deposit with {selectedPayment.name}
              </h3>

              {selectedPayment.walletAddress ? (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Send to this wallet address:</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 glass-light rounded-lg p-3 font-mono text-sm break-all">
                        {selectedPayment.walletAddress}
                      </div>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={handleCopyAddress}
                        data-testid="button-copy-address"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-500">Important</p>
                        <p className="text-muted-foreground">
                          Only send {selectedPayment.name.split(' ')[0]} to this address. Sending other cryptocurrencies may result in permanent loss.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Minimum Deposit</div>
                      <div className="font-semibold">{selectedPayment.minDeposit}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Processing Time</div>
                      <div className="font-semibold">{selectedPayment.processingTime}</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="amount">Deposit Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="mt-2"
                      data-testid="input-deposit-amount"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Minimum Deposit</div>
                      <div className="font-semibold">{selectedPayment.minDeposit}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fee</div>
                      <div className="font-semibold">{selectedPayment.fee}</div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={!depositAmount}
                    data-testid="button-proceed-deposit"
                  >
                    {selectedMethod === "paypal" ? "Continue with PayPal" : "Get Bank Details"}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </Card>
          )}

          {/* Pending Deposits */}
          {pendingDeposits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Deposits</h3>
              <div className="space-y-2">
                {pendingDeposits.map((deposit) => (
                  <Card 
                    key={deposit.id} 
                    className="glass-card p-4"
                    data-testid={`card-deposit-${deposit.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deposit.status)}
                        <div>
                          <div className="font-medium">{deposit.amount}</div>
                          <div className="text-xs text-muted-foreground">
                            {deposit.method} - {deposit.timestamp}
                          </div>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(deposit.status))}>
                        {deposit.status.toUpperCase()}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
