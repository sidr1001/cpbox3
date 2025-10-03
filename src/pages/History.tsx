import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react";

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error('Failed to load posts history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-500";
      case "scheduled": return "bg-yellow-500";
      case "failed": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published": return "Опубликован";
      case "scheduled": return "Запланирован";
      case "failed": return "Ошибка";
      default: return "Неизвестно";
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">История публикаций</h1>
          <p className="text-muted-foreground">
            Просматривайте и анализируйте ваши посты
          </p>
        </div>
        <Button onClick={fetchPosts} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {loading ? 'Загрузка...' : 'Обновить'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск по содержимому..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
              >
                Все
              </Button>
              <Button 
                variant={filterStatus === "published" ? "default" : "outline"}
                onClick={() => setFilterStatus("published")}
                size="sm"
              >
                Опубликованные
              </Button>
              <Button 
                variant={filterStatus === "scheduled" ? "default" : "outline"}
                onClick={() => setFilterStatus("scheduled")}
                size="sm"
              >
                Запланированные
              </Button>
              <Button 
                variant={filterStatus === "failed" ? "default" : "outline"}
                onClick={() => setFilterStatus("failed")}
                size="sm"
              >
                С ошибками
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post: any) => (
          <Card key={post.id} className="bg-gradient-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm leading-relaxed max-w-2xl whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <Button variant="ghost" size="icon" className="ml-4">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {(post.platforms || []).map((p: string) => {
                        const label = p.toLowerCase() === 'vk' ? 'VK' : 'Telegram'
                        const cls = p.toLowerCase() === 'vk' ? 'border-vk text-vk' : 'border-telegram text-telegram'
                        return (
                          <Badge key={p} variant="outline" className={cls}>
                            {label}
                          </Badge>
                        )
                      })}
                    </div>
                    
                    <Badge 
                      variant="secondary"
                      className={getStatusColor(post.status)}
                    >
                      {getStatusText(post.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {(() => {
                            const fmt = (d?: string | null) => d ? new Date(d).toLocaleString() : '-'
                            if (post.status === 'published') return `Опубликован: ${fmt(post.published_at)}`
                            if (post.status === 'scheduled') return `Запланирован: ${fmt(post.scheduled_at)}`
                            return `Создан: ${fmt(post.created_at)}`
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-border">
                <Button variant="ghost" size="sm">
                  <Eye className="w-3 h-3 mr-1" />
                  Просмотр
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="bg-gradient-card border-border">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Посты не найдены</h3>
            <p className="text-muted-foreground">
              Измените параметры поиска или создайте новый пост
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;