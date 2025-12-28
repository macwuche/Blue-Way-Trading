import { useState } from "react";
import { 
  Trophy, ArrowLeft, Medal, Users, Clock, 
  TrendingUp, Star, Crown, Award, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface Tournament {
  id: number;
  name: string;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "completed";
  entryFee: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  profit: string;
  profitPercent: string;
  trades: number;
}

const tournaments: Tournament[] = [
  { id: 1, name: "Daily Trading Challenge", prizePool: "500", participants: 156, maxParticipants: 500, startTime: "2024-01-15T09:00:00Z", endTime: "2024-01-15T21:00:00Z", status: "active", entryFee: "0" },
  { id: 2, name: "Weekend Warrior", prizePool: "2500", participants: 89, maxParticipants: 200, startTime: "2024-01-20T00:00:00Z", endTime: "2024-01-21T23:59:00Z", status: "upcoming", entryFee: "10" },
  { id: 3, name: "Crypto Masters", prizePool: "1000", participants: 234, maxParticipants: 300, startTime: "2024-01-14T00:00:00Z", endTime: "2024-01-14T23:59:00Z", status: "completed", entryFee: "5" },
];

const leaderboard: LeaderboardEntry[] = [
  { rank: 1, username: "CryptoKing", profit: "2450.00", profitPercent: "24.5", trades: 45 },
  { rank: 2, username: "TradeWizard", profit: "1890.50", profitPercent: "18.9", trades: 38 },
  { rank: 3, username: "ForexPro", profit: "1650.25", profitPercent: "16.5", trades: 52 },
  { rank: 4, username: "BinaryBoss", profit: "1420.00", profitPercent: "14.2", trades: 41 },
  { rank: 5, username: "MarketMaster", profit: "1280.75", profitPercent: "12.8", trades: 36 },
  { rank: 6, username: "ChartChamp", profit: "1150.00", profitPercent: "11.5", trades: 29 },
  { rank: 7, username: "PipHunter", profit: "980.50", profitPercent: "9.8", trades: 44 },
  { rank: 8, username: "TrendTrader", profit: "850.25", profitPercent: "8.5", trades: 33 },
  { rank: 9, username: "OptionsAce", profit: "720.00", profitPercent: "7.2", trades: 27 },
  { rank: 10, username: "RiskRunner", profit: "650.75", profitPercent: "6.5", trades: 31 },
];

export default function Tournament() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tournaments");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "active":
        return "bg-success/20 text-success";
      case "upcoming":
        return "bg-primary/20 text-primary";
      case "completed":
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
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
            <Trophy className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Tournaments</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-4 pb-24 md:pb-4">
          <Card className="glass-card p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Compete & Win</h2>
                <p className="text-sm text-muted-foreground">
                  Join trading tournaments and compete for prizes
                </p>
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full glass-light">
              <TabsTrigger value="tournaments" className="flex-1" data-testid="tab-tournaments">
                <Target className="w-4 h-4 mr-2" />
                Tournaments
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1" data-testid="tab-leaderboard">
                <Award className="w-4 h-4 mr-2" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tournaments" className="mt-4 space-y-3">
              {tournaments.map((tournament) => (
                <Card 
                  key={tournament.id} 
                  className="glass-card p-4"
                  data-testid={`card-tournament-${tournament.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{tournament.name}</h3>
                        <Badge className={cn("text-xs", getStatusColor(tournament.status))}>
                          {tournament.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {tournament.participants}/{tournament.maxParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          ${tournament.prizePool}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">${tournament.prizePool}</div>
                      <div className="text-xs text-muted-foreground">Prize Pool</div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(tournament.participants / tournament.maxParticipants) * 100} 
                    className="h-2 mb-3"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Entry: {tournament.entryFee === "0" ? "Free" : `$${tournament.entryFee}`}
                    </span>
                    <Button 
                      size="sm"
                      variant={tournament.status === "completed" ? "outline" : "default"}
                      disabled={tournament.status === "completed"}
                      data-testid={`button-join-tournament-${tournament.id}`}
                    >
                      {tournament.status === "completed" ? "Ended" : tournament.status === "active" ? "Join Now" : "Register"}
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-4">
              <Card className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border/30" data-testid="leaderboard-header">
                  <h3 className="font-semibold">Daily Trading Challenge</h3>
                  <p className="text-sm text-muted-foreground">Live standings</p>
                </div>
                <div className="divide-y divide-border/20">
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.rank}
                      className={cn(
                        "flex items-center gap-3 p-3",
                        entry.rank <= 3 && "bg-primary/5"
                      )}
                      data-testid={`row-leaderboard-${entry.rank}`}
                    >
                      <div className="w-8 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {entry.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entry.username}</div>
                        <div className="text-xs text-muted-foreground">{entry.trades} trades</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success">+${entry.profit}</div>
                        <div className="text-xs text-muted-foreground">+{entry.profitPercent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
