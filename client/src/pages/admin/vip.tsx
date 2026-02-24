import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Mail, Edit, Send, Eye, CheckCircle2, FileText, Loader2
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
}

export default function AdminEmailNotifications() {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    enabled: true,
  });

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, subject, enabled }: { id: string; subject: string; enabled: boolean }) => {
      return apiRequest("PUT", `/api/admin/email-templates/${id}`, { subject, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Template Updated", description: "Email template saved successfully." });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/email-templates/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to toggle template.", variant: "destructive" });
    },
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
      updateMutation.mutate({
        id: selectedTemplate.id,
        subject: formData.subject,
        enabled: formData.enabled,
      });
    }
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                  disabled={toggleMutation.isPending}
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
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-template">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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
                <h3 className="text-white font-bold text-lg">Bluewave Trading</h3>
              </div>
              <div className="bg-[#1a1f2e] p-6">
                <p className="text-white/80 text-sm font-semibold mb-2">
                  Subject: {selectedTemplate?.subject}
                </p>
                <div className="bg-white/5 rounded-lg p-4 mt-3">
                  <p className="text-white/60 text-sm">
                    {selectedTemplate?.id === "welcome" && "Hello [Name], Your Bluewave Trading account has been successfully created. You're now ready to start trading across crypto, forex, stocks, and ETFs."}
                    {selectedTemplate?.id === "trade-opened" && "A new trade has been opened on your account. Symbol: [symbol], Direction: [direction], Volume: [volume], Entry Price: [price]."}
                    {selectedTemplate?.id === "trade-closed" && "A trade on your account has been closed. Symbol: [symbol], P&L: [pnl]. The result has been applied to your portfolio."}
                    {selectedTemplate?.id === "balance-adjustment" && "Your account balance has been updated by an administrator. New Balance: [balance]."}
                    {selectedTemplate?.id === "profit-adjustment" && "Your account profit has been adjusted by an administrator. Adjustment: [amount]."}
                  </p>
                </div>
              </div>
              <div className="bg-[#0d1117] p-3 text-center">
                <p className="text-white/30 text-xs">Bluewave Trading - Trade Smarter</p>
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
