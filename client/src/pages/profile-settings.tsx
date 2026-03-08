import { ArrowLeft, Camera, MapPin, Mail, User as UserIcon, Phone, Globe } from "lucide-react";
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
import { useState, useEffect } from "react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function ProfileSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [address, setAddress] = useState(user?.address || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");

  useEffect(() => {
    if (user) {
      setAddress(user.address || "");
      setProfileImageUrl(user.profileImageUrl || "");
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: { profileImageUrl?: string; address?: string }) => {
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

  const handleSave = () => {
    updateProfile.mutate({ profileImageUrl, address });
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
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user?.firstName?.slice(0, 1).toUpperCase() || "T"}{user?.lastName?.slice(0, 1).toUpperCase() || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold" data-testid="text-profile-name">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Trader"}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
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
            <h3 className="text-sm font-medium text-muted-foreground px-1">Editable</h3>
            <Card className="glass-card p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Profile Picture URL
                </Label>
                <Input
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  data-testid="input-profile-image"
                />
              </div>
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
