import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  TrendingUp, TrendingDown, Search, DollarSign,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, User,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
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
import { allAssets, type Asset } from "@/lib/market-data";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  balance: string;
  vipLevel: string | null;
}

export default function TradeForUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [tradeAmount, setTradeAmount] = useState(100);
  const [assetSearch, setAssetSearch] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const executeTradeMutation = useMutation({
    mutationFn: async (data: { 
      userId: string; 
      symbol: string; 
      name: string;
      assetType: string;
      type: "buy" | "sell";
      quantity: number;
      price: number;
    }) => {
      return apiRequest("POST", "/api/admin/trade-for-user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ 
        title: "Trade Executed", 
        description: `Trade placed successfully for ${selectedUser?.firstName || selectedUser?.email}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Trade Failed", 
        description: error?.message || "Failed to execute trade", 
        variant: "destructive" 
      });
    }
  });

  const filteredUsers = users.filter(user => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const filteredAssets = allAssets.filter((asset: Asset) => {
    const query = assetSearch.toLowerCase();
    return asset.symbol.toLowerCase().includes(query) || 
           asset.name.toLowerCase().includes(query);
  });

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

  const handleTrade = (type: "buy" | "sell") => {
    if (!selectedUser || !selectedAsset) {
      toast({ 
        title: "Missing Selection", 
        description: "Please select both a user and an asset", 
        variant: "destructive" 
      });
      return;
    }

    const quantity = tradeAmount / selectedAsset.price;

    executeTradeMutation.mutate({
      userId: selectedUser.id,
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      assetType: selectedAsset.type,
      type,
      quantity,
      price: selectedAsset.price,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Trade for Users</h2>
        <p className="text-sm text-muted-foreground">Execute trades on behalf of users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-card p-4 sm:p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Select User
          </h3>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-trade-users"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            ) : (
              filteredUsers.slice(0, 10).map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  data-testid={`button-select-user-${user.id}`}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                    selectedUser?.id === user.id
                      ? "bg-primary/20 border border-primary/50"
                      : "glass-light hover-elevate"
                  )}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{getUserName(user)}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-medium text-sm">${parseFloat(user.balance).toLocaleString()}</div>
                    <Badge className="text-xs bg-primary/10 text-primary">{user.vipLevel || "Bronze"}</Badge>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {selectedUser && (
            <div className="mt-4 p-3 glass-light rounded-lg">
              <p className="text-sm font-medium">Selected User</p>
              <p className="text-lg font-bold">{getUserName(selectedUser)}</p>
              <p className="text-sm text-muted-foreground">Balance: ${parseFloat(selectedUser.balance).toLocaleString()}</p>
            </div>
          )}
        </Card>

        <Card className="glass-card p-4 sm:p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Select Asset
          </h3>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-assets"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredAssets.slice(0, 10).map((asset: Asset) => (
              <button
                key={asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                data-testid={`button-select-asset-${asset.symbol}`}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                  selectedAsset?.symbol === asset.symbol
                    ? "bg-primary/20 border border-primary/50"
                    : "glass-light hover-elevate"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">{asset.symbol.slice(0, 3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">{asset.type}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-medium text-sm">${asset.price.toLocaleString()}</div>
                  <span className={cn(
                    "text-xs",
                    asset.change24h >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {asset.change24h >= 0 ? "+" : ""}{asset.change24h.toFixed(2)}%
                  </span>
                </div>
                {selectedAsset?.symbol === asset.symbol && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {selectedAsset && (
            <div className="mt-4 p-3 glass-light rounded-lg">
              <p className="text-sm font-medium">Selected Asset</p>
              <p className="text-lg font-bold">{selectedAsset.name}</p>
              <p className="text-sm text-muted-foreground">Price: ${selectedAsset.price.toLocaleString()}</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="glass-card p-4 sm:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Trade Amount
        </h3>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Amount (USD)</span>
              <span className="text-2xl font-bold">${tradeAmount.toLocaleString()}</span>
            </div>
            <Slider
              value={[tradeAmount]}
              onValueChange={(v) => setTradeAmount(v[0])}
              min={1}
              max={selectedUser ? Math.min(parseFloat(selectedUser.balance), 100000) : 10000}
              step={1}
              className="py-4"
              data-testid="slider-trade-amount"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$1</span>
              <span>${selectedUser ? Math.min(parseFloat(selectedUser.balance), 100000).toLocaleString() : "10,000"}</span>
            </div>
          </div>

          {selectedAsset && (
            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <span className="font-medium">
                  {(tradeAmount / selectedAsset.price).toFixed(8)} {selectedAsset.symbol}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="bg-success hover:bg-success/90 min-h-[56px]"
              onClick={() => handleTrade("buy")}
              disabled={!selectedUser || !selectedAsset || executeTradeMutation.isPending}
              data-testid="button-buy"
            >
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              BUY / HIGHER
            </Button>
            <Button
              size="lg"
              className="bg-destructive hover:bg-destructive/90 min-h-[56px]"
              onClick={() => handleTrade("sell")}
              disabled={!selectedUser || !selectedAsset || executeTradeMutation.isPending}
              data-testid="button-sell"
            >
              <ArrowDownCircle className="w-5 h-5 mr-2" />
              SELL / LOWER
            </Button>
          </div>

          {(!selectedUser || !selectedAsset) && (
            <p className="text-center text-sm text-muted-foreground">
              Select a user and an asset to execute a trade
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
