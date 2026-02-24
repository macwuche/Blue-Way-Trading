import { useState } from "react";
import { 
  Mail, Edit, Send, Eye, CheckCircle2, FileText
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
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  enabled: boolean;
  lastUpdated: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to Blue Way Trading!",
    description: "Sent when a new user registers an account",
    enabled: true,
    lastUpdated: "2026-02-24",
  },
  {
    id: "trade-opened",
    name: "Trade Opened",
    subject: "Trade Opened - {symbol}",
    description: "Sent when a user or admin opens a new trade position",
    enabled: true,
    lastUpdated: "2026-02-24",
  },
  {
    id: "trade-closed",
    name: "Trade Closed",
    subject: "Trade Closed - {symbol}",
    description: "Sent when a trade position is closed with P&L summary",
    enabled: true,
    lastUpdated: "2026-02-24",
  },
  {
    id: "balance-adjustment",
    name: "Balance Adjustment",
    subject: "Balance Updated - Blue Way Trading",
    description: "Sent when an admin adjusts a user's account balance",
    enabled: true,
    lastUpdated: "2026-02-24",
  },
  {
    id: "profit-adjustment",
    name: "Profit Adjustment",
    subject: "Profit Updated - Blue Way Trading",
    description: "Sent when an admin adjusts a user's profit",
    enabled: true,
    lastUpdated: "2026-02-24",
  },
];

export default function AdminEmailNotifications() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    enabled: true,
  });

  const enabledCount = templates.filter(t => t.enabled).length;

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      subject: template.subject,
      enabled: template.enabled,
    });
    setEditDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, subject: formData.subject, enabled: formData.enabled, lastUpdated: new Date().toISOString().split("T")[0] }
          : t
      ));
      setEditDialogOpen(false);
    }
  };

  const handleToggle = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-email-notifications-title">Email Notifications</h2>
        <p className="text-muted-foreground">Configure email notification templates and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-templates">{templates.length}</p>
              <p className="text-sm text-muted-foreground">Total Templates</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-enabled-templates">{enabledCount}</p>
              <p className="text-sm text-muted-foreground">Active Templates</p>
            </div>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sender Address</p>
              <p className="text-xs font-mono text-white/70 mt-1" data-testid="text-sender-address">noreply@bluewavetrading.live</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={cn("glass-card p-4 transition-opacity", !template.enabled && "opacity-50")}
            data-testid={`card-email-template-${template.id}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge 
                    className={cn(
                      "text-xs",
                      template.enabled 
                        ? "bg-success/20 text-success" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {template.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Subject: <span className="text-white/50 font-mono">{template.subject}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch 
                  checked={template.enabled}
                  onCheckedChange={() => handleToggle(template.id)}
                  data-testid={`switch-toggle-${template.id}`}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handlePreview(template)}
                  data-testid={`button-preview-${template.id}`}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleEdit(template)}
                  data-testid={`button-edit-${template.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Edit {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Subject Line</Label>
              <Input 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-2"
                placeholder="Email subject..."
                data-testid="input-email-subject"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {"{symbol}"}, {"{amount}"}, {"{name}"} as placeholders
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                data-testid="switch-edit-enabled"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-template">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Preview: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <div className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] p-4 text-center">
                <h3 className="text-white font-bold text-lg">Blue Way Trading</h3>
              </div>
              <div className="bg-[#1a1f2e] p-6">
                <p className="text-white/80 text-sm font-semibold mb-2">
                  Subject: {selectedTemplate?.subject}
                </p>
                <div className="bg-white/5 rounded-lg p-4 mt-3">
                  <p className="text-white/60 text-sm">
                    {selectedTemplate?.id === "welcome" && "Hello [Name], Your Blue Way Trading account has been successfully created. You're now ready to start trading across crypto, forex, stocks, and ETFs."}
                    {selectedTemplate?.id === "trade-opened" && "A new trade has been opened on your account. Symbol: [symbol], Direction: [direction], Volume: [volume], Entry Price: [price]."}
                    {selectedTemplate?.id === "trade-closed" && "A trade on your account has been closed. Symbol: [symbol], P&L: [pnl]. The result has been applied to your portfolio."}
                    {selectedTemplate?.id === "balance-adjustment" && "Your account balance has been updated by an administrator. New Balance: [balance]."}
                    {selectedTemplate?.id === "profit-adjustment" && "Your account profit has been adjusted by an administrator. Adjustment: [amount]."}
                  </p>
                </div>
              </div>
              <div className="bg-[#0d1117] p-3 text-center">
                <p className="text-white/30 text-xs">Blue Way Trading - Trade Smarter</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)} data-testid="button-close-preview">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
