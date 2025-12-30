import { useState } from "react";
import { 
  Crown, Edit, Star, Shield, Zap, Award, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VipLevel {
  id: string;
  name: string;
  icon: typeof Crown;
  color: string;
  minDeposit: number;
  payout: number;
  benefits: string[];
  usersCount: number;
}

const mockVipLevels: VipLevel[] = [
  {
    id: "bronze",
    name: "Bronze",
    icon: Award,
    color: "text-amber-700",
    minDeposit: 100,
    payout: 80,
    benefits: ["Basic trading features", "Standard withdrawal processing", "Email support"],
    usersCount: 4521
  },
  {
    id: "silver",
    name: "Silver",
    icon: Shield,
    color: "text-gray-400",
    minDeposit: 1000,
    payout: 83,
    benefits: ["All Bronze benefits", "Priority withdrawal", "Personal account manager"],
    usersCount: 1823
  },
  {
    id: "gold",
    name: "Gold",
    icon: Star,
    color: "text-yellow-500",
    minDeposit: 5000,
    payout: 87,
    benefits: ["All Silver benefits", "Express withdrawal", "Risk-free trades"],
    usersCount: 756
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: Zap,
    color: "text-cyan-400",
    minDeposit: 25000,
    payout: 90,
    benefits: ["All Gold benefits", "Instant withdrawals", "24/7 dedicated support"],
    usersCount: 234
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: Crown,
    color: "text-purple-400",
    minDeposit: 100000,
    payout: 95,
    benefits: ["All Platinum benefits", "No withdrawal limits", "Private wealth manager"],
    usersCount: 45
  }
];

export default function AdminVip() {
  const [levels, setLevels] = useState(mockVipLevels);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<VipLevel | null>(null);
  const [formData, setFormData] = useState({
    minDeposit: 0,
    payout: 0,
  });

  const totalVipUsers = levels.reduce((sum, level) => sum + level.usersCount, 0);

  const handleEdit = (level: VipLevel) => {
    setSelectedLevel(level);
    setFormData({
      minDeposit: level.minDeposit,
      payout: level.payout,
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedLevel) {
      setLevels(prev => prev.map(l => 
        l.id === selectedLevel.id 
          ? { ...l, minDeposit: formData.minDeposit, payout: formData.payout }
          : l
      ));
      setEditDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">VIP Level Management</h2>
        <p className="text-muted-foreground">Configure VIP tiers and benefits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalVipUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total VIP Users</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{levels.find(l => l.id === "diamond")?.usersCount}</p>
              <p className="text-sm text-muted-foreground">Diamond Members</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{levels.length}</p>
              <p className="text-sm text-muted-foreground">Active Tiers</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {levels.map((level) => (
          <Card 
            key={level.id} 
            className="glass-card p-4"
            data-testid={`card-vip-level-${level.id}`}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center",
                level.color
              )}>
                <level.icon className="w-7 h-7" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{level.name}</h3>
                  <Badge className="text-xs bg-primary/20 text-primary">
                    {level.usersCount.toLocaleString()} users
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-muted-foreground">Min Deposit</div>
                    <div className="font-semibold">${level.minDeposit.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Payout Rate</div>
                    <div className="font-semibold text-success">{level.payout}%</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {level.benefits.map((benefit, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEdit(level)}
                data-testid={`button-edit-vip-${level.id}`}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLevel && (
                <>
                  <selectedLevel.icon className={cn("w-5 h-5", selectedLevel.color)} />
                  Edit {selectedLevel.name} Level
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Minimum Deposit ($)</Label>
              <Input 
                type="number"
                value={formData.minDeposit}
                onChange={(e) => setFormData({ ...formData, minDeposit: parseInt(e.target.value) || 0 })}
                className="mt-2"
                data-testid="input-vip-min-deposit"
              />
            </div>
            <div>
              <Label>Payout Rate (%)</Label>
              <Input 
                type="number"
                value={formData.payout}
                onChange={(e) => setFormData({ ...formData, payout: parseInt(e.target.value) || 0 })}
                className="mt-2"
                min={0}
                max={100}
                data-testid="input-vip-payout"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-vip">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
