import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  User, 
  Settings, 
  ExternalLink, 
  RefreshCw,
  Loader2,
  Shield,
  Edit,
  Crown
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface VkUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100: string;
  screen_name: string;
}

interface VkGroup {
  id: number;
  name: string;
  screen_name: string;
  photo_100: string;
  type: string;
  is_admin: boolean;
  admin_level: number;
}

interface VkConnectionInfo {
  user: VkUser;
  groups: VkGroup[];
  pages: any;
}

interface VkConnectionInfoProps {
  vkToken: string;
  onRefresh?: () => void;
}

export function VkConnectionInfo({ vkToken, onRefresh }: VkConnectionInfoProps) {
  const [connectionInfo, setConnectionInfo] = useState<VkConnectionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConnectionInfo = async () => {
    if (!vkToken) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getVkMe(vkToken);
      setConnectionInfo(data as any);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить информацию';
      setError(errorMessage);
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionInfo();
  }, [vkToken]);

  const getAdminLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Модератор';
      case 2: return 'Редактор';
      case 3: return 'Администратор';
      default: return 'Участник';
    }
  };

  const getAdminLevelIcon = (level: number) => {
    switch (level) {
      case 1: return <Shield className="w-4 h-4" />;
      case 2: return <Edit className="w-4 h-4" />;
      case 3: return <Crown className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Загрузка информации о подключении...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card border-border">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ошибка загрузки
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchConnectionInfo} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connectionInfo) {
    return null;
  }

  const { user, groups } = connectionInfo;
  const totalConnections = 1 + groups.length; // user + groups

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Подключенные аккаунты</span>
            <Badge variant="outline" className="ml-auto">
              {totalConnections} {totalConnections === 1 ? 'аккаунт' : 'аккаунтов'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Управляйте подключенными аккаунтами ВКонтакте
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.photo_100} alt={user.first_name} />
                <AvatarFallback>
                  {user.first_name[0]}{user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Личная страница
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-vk text-vk">
                <User className="w-3 h-3 mr-1" />
                Личная страница
              </Badge>
              <Button variant="ghost" size="sm" onClick={fetchConnectionInfo}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      {groups.length > 0 && (
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Сообщества</span>
              <Badge variant="outline" className="ml-auto">
                {groups.length} {groups.length === 1 ? 'сообщество' : 'сообществ'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Группы и страницы, которыми вы управляете
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={group.photo_100} alt={group.name} />
                    <AvatarFallback>
                      {group.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{group.screen_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={group.is_admin ? "border-emerald-500 text-emerald-500" : "border-blue-500 text-blue-500"}
                  >
                    {getAdminLevelIcon(group.admin_level)}
                    <span className="ml-1">{getAdminLevelText(group.admin_level)}</span>
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href={`https://vk.com/${group.screen_name}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Управление подключением</h4>
              <p className="text-sm text-muted-foreground">
                Обновите информацию или отключите аккаунт
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={fetchConnectionInfo}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}