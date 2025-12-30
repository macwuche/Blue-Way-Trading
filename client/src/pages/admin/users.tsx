import { useState } from "react";
import { 
  Search, MoreVertical, CheckCircle2, XCircle, 
  Eye, Ban, Mail, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  balance: string;
  status: "active" | "suspended" | "pending";
  verified: boolean;
  vipLevel: string;
  joinDate: string;
}

const mockUsers: User[] = [
  { id: "1", name: "John Trader", email: "john@example.com", balance: "5,420", status: "active", verified: true, vipLevel: "Gold", joinDate: "Jan 15, 2024" },
  { id: "2", name: "Sarah Crypto", email: "sarah@example.com", balance: "12,300", status: "active", verified: true, vipLevel: "Platinum", joinDate: "Dec 10, 2023" },
  { id: "3", name: "Mike Forex", email: "mike@example.com", balance: "890", status: "pending", verified: false, vipLevel: "Bronze", joinDate: "Mar 1, 2024" },
  { id: "4", name: "Emily Stocks", email: "emily@example.com", balance: "3,200", status: "active", verified: true, vipLevel: "Silver", joinDate: "Feb 20, 2024" },
  { id: "5", name: "James Options", email: "james@example.com", balance: "0", status: "suspended", verified: false, vipLevel: "Bronze", joinDate: "Jan 5, 2024" },
];

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users] = useState(mockUsers);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "active": return "bg-success/20 text-success";
      case "suspended": return "bg-destructive/20 text-destructive";
      case "pending": return "bg-yellow-500/20 text-yellow-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage all registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-users"
            />
          </div>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Balance</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">VIP Level</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-border/20 hover:bg-muted/5"
                  data-testid={`row-user-${user.id}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.verified && <CheckCircle2 className="w-4 h-4 text-success" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">${user.balance}</span>
                  </td>
                  <td className="p-4">
                    <Badge className={cn("text-xs", getStatusColor(user.status))}>
                      {user.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{user.vipLevel}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{user.joinDate}</span>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-user-actions-${user.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-dark border-white/10">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          Verify Account
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Ban className="w-4 h-4 mr-2" />
                          {user.status === "suspended" ? "Activate" : "Suspend"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
