import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PenTool, 
  Calendar, 
  BarChart3, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: "Всего постов", value: "0", icon: Send, color: "text-primary" },
    { title: "Запланированных", value: "0", icon: Clock, color: "text-telegram" },
    { title: "Опубликованных", value: "0", icon: CheckCircle, color: "text-emerald-500" },
    { title: "Ошибок", value: "0", icon: XCircle, color: "text-destructive" },
  ]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent posts (last 10)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;

      setRecentPosts(posts || []);

      // Calculate stats
      const totalPosts = posts?.length || 0;
      const scheduledPosts = posts?.filter(post => post.status === 'scheduled').length || 0;
      const publishedPosts = posts?.filter(post => post.status === 'published').length || 0;
      const errorPosts = posts?.filter(post => post.status === 'error').length || 0;

      setStats([
        { title: "Всего постов", value: totalPosts.toString(), icon: Send, color: "text-primary" },
        { title: "Запланированных", value: scheduledPosts.toString(), icon: Clock, color: "text-telegram" },
        { title: "Опубликованных", value: publishedPosts.toString(), icon: CheckCircle, color: "text-emerald-500" },
        { title: "Ошибок", value: errorPosts.toString(), icon: XCircle, color: "text-destructive" },
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные дашборда",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-card rounded-xl p-8 border border-border shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Добро пожаловать в CrossPost Pro
            </h1>
            <p className="text-muted-foreground text-lg">
              Управляйте публикациями в VK и Telegram из одного места
            </p>
          </div>
          <Link to="/create">
            <Button size="lg" className="shadow-button">
              <PenTool className="w-5 h-5 mr-2" />
              Создать пост
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Posts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts */}
        <Card className="lg:col-span-2 bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Последние публикации</span>
            </CardTitle>
            <CardDescription>
              Статус ваших недавних постов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Пока нет публикаций</p>
                <Link to="/create" className="text-primary hover:underline">
                  Создать первый пост
                </Link>
              </div>
            ) : (
              <>
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex items-start justify-between p-4 rounded-lg border border-border bg-background/50">
                    <div className="space-y-2 flex-1">
                      <p className="text-sm">{post.title}</p>
                      {post.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                      )}
                      <div className="flex items-center space-x-2">
                        {post.platforms?.map((platform: string) => (
                          <Badge 
                            key={platform} 
                            variant="outline"
                            className={platform === "vk" ? "border-vk text-vk" : "border-telegram text-telegram"}
                          >
                            {platform === "vk" ? "VK" : "Telegram"}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {post.status === "published" 
                          ? `Опубликован: ${new Date(post.published_at || post.created_at).toLocaleString('ru-RU')}`
                          : post.status === "scheduled"
                          ? `Запланирован: ${new Date(post.scheduled_at).toLocaleString('ru-RU')}`
                          : `Создан: ${new Date(post.created_at).toLocaleString('ru-RU')}`
                        }
                      </p>
                    </div>
                    <Badge 
                      variant={post.status === "published" ? "default" : post.status === "scheduled" ? "secondary" : "destructive"}
                      className={post.status === "published" ? "bg-emerald-500" : ""}
                    >
                      {post.status === "published" ? "Опубликован" : 
                       post.status === "scheduled" ? "Запланирован" :
                       post.status === "error" ? "Ошибка" : "Черновик"}
                    </Badge>
                  </div>
                ))}
                {recentPosts.length === 10 && (
                  <div className="text-center pt-4">
                    <Link to="/history">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Посмотреть всю историю
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Быстрые действия</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/create" className="block">
              <Button className="w-full justify-start" variant="outline">
                <PenTool className="w-4 h-4 mr-2" />
                Создать новый пост
              </Button>
            </Link>
            
            <Link to="/history" className="block">
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Просмотреть аналитику
              </Button>
            </Link>
            
            <Link to="/settings" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Настроить платформы
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;