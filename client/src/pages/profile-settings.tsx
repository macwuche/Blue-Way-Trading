import { ArrowLeft, Camera, MapPin, Mail, User as UserIcon, Phone, Globe, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function ProfileSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [address, setAddress] = useState(user?.address || "");
  const [previewUrl, setPreviewUrl] = useState(user?.profileImageUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setAddress(user.address || "");
      setPreviewUrl(user.profileImageUrl || "");
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: { address?: string }) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/user/profile-picture", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const updatedUser = await res.json();
      setPreviewUrl(updatedUser.profileImageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Photo updated", description: "Your profile picture has been changed." });
    } catch (error: any) {
      setPreviewUrl(user?.profileImageUrl || "");
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localPreview);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    updateProfile.mutate({ address });
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-background to-background/95">
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
          <h1 className="text-lg font-semibold">Profile Settings</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-6 pb-24 md:pb-4 max-w-lg mx-auto">
          <Card className="glass-card p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="input-avatar-file"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group"
                  disabled={isUploading}
                  data-testid="button-change-avatar"
                >
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={previewUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user?.firstName?.slice(0, 1).toUpperCase() || "T"}{user?.lastName?.slice(0, 1).toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </button>
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center pointer-events-none">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold" data-testid="text-profile-name">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Trader"}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Tap photo to change</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Personal Information</h3>
            <Card className="glass-card p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Full Name
                </Label>
                <Input
                  value={user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : ""}
                  disabled
                  className="bg-muted/50"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                <Input
                  value={user?.phone || ""}
                  disabled
                  className="bg-muted/50"
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Country
                </Label>
                <Input
                  value={user?.country || ""}
                  disabled
                  className="bg-muted/50"
                  data-testid="input-country"
                />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Address</h3>
            <Card className="glass-card p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Home Address
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your home address"
                  data-testid="input-address"
                />
              </div>
            </Card>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={updateProfile.isPending}
            data-testid="button-save-profile"
          >
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </ScrollArea>
      <MobileBottomNav />
    </div>
  );
}
