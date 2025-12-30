import { useState } from "react";
import { 
  Plus, Edit, Trash2, Eye, Search, Globe, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: "market" | "platform";
  status: "published" | "draft";
  createdAt: string;
  author: string;
}

const mockNews: NewsArticle[] = [
  { id: "1", title: "Bitcoin Surges Past $45,000", summary: "Bitcoin reached new yearly highs amid increasing institutional adoption...", category: "market", status: "published", createdAt: "2 hours ago", author: "Admin" },
  { id: "2", title: "New Trading Features Available", summary: "We've added new chart indicators and trading tools...", category: "platform", status: "published", createdAt: "1 day ago", author: "Admin" },
  { id: "3", title: "VIP Program Launch", summary: "Introducing our new VIP program with exclusive benefits...", category: "platform", status: "published", createdAt: "2 days ago", author: "Admin" },
  { id: "4", title: "Weekend Trading Hours Extended", summary: "Trade cryptocurrencies 24/7 with our new extended hours...", category: "platform", status: "draft", createdAt: "3 days ago", author: "Admin" },
];

export default function AdminNews() {
  const [news, setNews] = useState(mockNews);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    category: "market" as "market" | "platform",
  });

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    return article.category === activeTab && matchesSearch;
  });

  const handleCreateNew = () => {
    setSelectedArticle(null);
    setFormData({ title: "", summary: "", category: "market" });
    setEditDialogOpen(true);
  };

  const handleEdit = (article: NewsArticle) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      summary: article.summary,
      category: article.category,
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedArticle) {
      setNews(prev => prev.map(a => 
        a.id === selectedArticle.id 
          ? { ...a, ...formData }
          : a
      ));
    } else {
      const newArticle: NewsArticle = {
        id: `new-${Date.now()}`,
        ...formData,
        status: "draft",
        createdAt: "Just now",
        author: "Admin",
      };
      setNews(prev => [newArticle, ...prev]);
    }
    setEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setNews(prev => prev.filter(a => a.id !== id));
  };

  const handlePublish = (id: string) => {
    setNews(prev => prev.map(a => 
      a.id === id ? { ...a, status: "published" as const } : a
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">News Management</h2>
          <p className="text-muted-foreground">Create and manage news articles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-news"
            />
          </div>
          <Button onClick={handleCreateNew} data-testid="button-create-news">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-light">
          <TabsTrigger value="all" data-testid="tab-news-all">
            All
          </TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-news-market">
            <Globe className="w-4 h-4 mr-1" />
            Market News
          </TabsTrigger>
          <TabsTrigger value="platform" data-testid="tab-news-platform">
            <Bell className="w-4 h-4 mr-1" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-3">
            {filteredNews.map((article) => (
              <Card 
                key={article.id} 
                className="glass-card p-4"
                data-testid={`card-news-article-${article.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={cn(
                        "text-xs",
                        article.category === "market" 
                          ? "bg-blue-500/20 text-blue-500" 
                          : "bg-primary/20 text-primary"
                      )}>
                        {article.category === "market" ? "Market News" : "Announcement"}
                      </Badge>
                      <Badge className={cn(
                        "text-xs",
                        article.status === "published" 
                          ? "bg-success/20 text-success" 
                          : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {article.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold mb-1">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                    
                    <div className="text-xs text-muted-foreground">
                      By {article.author} - {article.createdAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {article.status === "draft" && (
                      <Button 
                        size="sm" 
                        className="bg-success hover:bg-success/90"
                        onClick={() => handlePublish(article.id)}
                        data-testid={`button-publish-${article.id}`}
                      >
                        Publish
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(article)}
                      data-testid={`button-edit-news-${article.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                      data-testid={`button-delete-news-${article.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-dark border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedArticle ? "Edit Article" : "Create New Article"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v as "market" | "platform" })}
              >
                <SelectTrigger className="mt-2" data-testid="select-news-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market News</SelectItem>
                  <SelectItem value="platform">Platform Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2"
                placeholder="Enter article title"
                data-testid="input-news-title"
              />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea 
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="mt-2"
                placeholder="Enter article summary"
                rows={4}
                data-testid="input-news-summary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title || !formData.summary}
              data-testid="button-save-news"
            >
              {selectedArticle ? "Save Changes" : "Create Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
