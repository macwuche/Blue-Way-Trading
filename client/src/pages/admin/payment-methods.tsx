import { useState } from "react";
import { 
  Plus, Edit, Trash2, CheckCircle2, XCircle,
  CreditCard, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SiBitcoin, SiEthereum, SiTether, SiPaypal } from "react-icons/si";

interface PaymentMethod {
  id: string;
  name: string;
  type: "crypto" | "fiat";
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  minDeposit: string;
  minWithdrawal: string;
  fee: string;
  walletAddress?: string;
}

const mockPaymentMethods: PaymentMethod[] = [
  { id: "1", name: "Bitcoin (BTC)", type: "crypto", icon: SiBitcoin, enabled: true, minDeposit: "0.001 BTC", minWithdrawal: "$50", fee: "0%", walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { id: "2", name: "Ethereum (ETH)", type: "crypto", icon: SiEthereum, enabled: true, minDeposit: "0.01 ETH", minWithdrawal: "$50", fee: "0%", walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
  { id: "3", name: "Tether (USDT)", type: "crypto", icon: SiTether, enabled: true, minDeposit: "$10", minWithdrawal: "$20", fee: "0%", walletAddress: "TJYeasTPa6gpEh5M6J6V1qLPKXdJ9XwVXK" },
  { id: "4", name: "PayPal", type: "fiat", icon: SiPaypal, enabled: true, minDeposit: "$10", minWithdrawal: "$20", fee: "2.5%" },
  { id: "5", name: "Bank Transfer", type: "fiat", icon: Building2, enabled: false, minDeposit: "$100", minWithdrawal: "$100", fee: "0%" },
];

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState(mockPaymentMethods);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [newWalletAddress, setNewWalletAddress] = useState("");

  const handleToggleEnabled = (id: string) => {
    setMethods(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setNewWalletAddress(method.walletAddress || "");
    setEditDialogOpen(true);
  };

  const handleSaveMethod = () => {
    if (selectedMethod) {
      setMethods(prev => prev.map(m => 
        m.id === selectedMethod.id ? { ...m, walletAddress: newWalletAddress } : m
      ));
      setEditDialogOpen(false);
      setSelectedMethod(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">Configure deposit and withdrawal options</p>
        </div>
        <Button data-testid="button-add-payment-method">
          <Plus className="w-4 h-4 mr-2" />
          Add Method
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Cryptocurrency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.filter(m => m.type === "crypto").map((method) => (
            <Card 
              key={method.id} 
              className={cn("glass-card p-4", !method.enabled && "opacity-60")}
              data-testid={`card-payment-method-${method.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <method.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {method.name}
                      {method.enabled ? (
                        <Badge className="text-xs bg-success/20 text-success">Active</Badge>
                      ) : (
                        <Badge className="text-xs bg-muted text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Fee: {method.fee}</div>
                  </div>
                </div>
                <Switch 
                  checked={method.enabled}
                  onCheckedChange={() => handleToggleEnabled(method.id)}
                  data-testid={`switch-method-${method.id}`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <div className="text-muted-foreground">Min Deposit</div>
                  <div className="font-medium">{method.minDeposit}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Min Withdrawal</div>
                  <div className="font-medium">{method.minWithdrawal}</div>
                </div>
              </div>

              {method.walletAddress && (
                <div className="text-xs font-mono bg-muted/20 rounded p-2 truncate mb-4">
                  {method.walletAddress}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditMethod(method)}
                  data-testid={`button-edit-method-${method.id}`}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <h3 className="font-semibold pt-4">Fiat Currency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.filter(m => m.type === "fiat").map((method) => (
            <Card 
              key={method.id} 
              className={cn("glass-card p-4", !method.enabled && "opacity-60")}
              data-testid={`card-payment-method-${method.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <method.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {method.name}
                      {method.enabled ? (
                        <Badge className="text-xs bg-success/20 text-success">Active</Badge>
                      ) : (
                        <Badge className="text-xs bg-muted text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Fee: {method.fee}</div>
                  </div>
                </div>
                <Switch 
                  checked={method.enabled}
                  onCheckedChange={() => handleToggleEnabled(method.id)}
                  data-testid={`switch-method-${method.id}`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <div className="text-muted-foreground">Min Deposit</div>
                  <div className="font-medium">{method.minDeposit}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Min Withdrawal</div>
                  <div className="font-medium">{method.minWithdrawal}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditMethod(method)}
                  data-testid={`button-edit-method-${method.id}`}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          {selectedMethod && (
            <div className="py-4 space-y-4">
              <div>
                <Label>Method Name</Label>
                <Input value={selectedMethod.name} disabled className="mt-2" />
              </div>
              {selectedMethod.type === "crypto" && (
                <div>
                  <Label>Wallet Address</Label>
                  <Input 
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="mt-2 font-mono text-sm"
                    data-testid="input-wallet-address"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMethod} data-testid="button-save-method">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
