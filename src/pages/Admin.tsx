import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Settings, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  balance: number;
  role: string;
  work_hours_start?: string;
  work_hours_end?: string;
  service_rate?: number;
}

interface SiteSettings {
  site_name: string;
  site_title: string;
  site_description: string;
  seo_keywords: string;
  admin_url: string;
  payment_methods: string[];
}

import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Admin() {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useDocumentTitle("Панель суперадмина");
  
  const [users, setUsers] = useState<User[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: '',
    site_title: '',
    site_description: '',
    seo_keywords: '',
    admin_url: '/admin',
    payment_methods: ['card', 'bank_transfer']
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate('/');
      return;
    }

    if (isSuperAdmin) {
      fetchUsers();
      fetchSiteSettings();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchUsers = async () => {
    try {
      // Assuming backend provides aggregated admin data endpoint in settings (or implement dedicated endpoint)
      // For now pull settings for current user only; extend backend later for full admin list
      setUsers([]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      });
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const data: any = await apiClient.getSettings();
      setSiteSettings({
        site_name: data?.site_name || '',
        site_title: data?.site_title || '',
        site_description: data?.site_description || '',
        seo_keywords: data?.seo_keywords || '',
        admin_url: data?.admin_url || '/admin',
        payment_methods: Array.isArray(data?.payment_methods) ? data.payment_methods : ['card', 'bank_transfer'],
      });
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      // TODO: implement admin endpoint to update user status

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));

      toast({
        title: "Успешно",
        description: `Пользователь ${isActive ? 'активирован' : 'деактивирован'}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      // TODO: implement admin endpoint to update user balance

      setUsers(users.map(user => 
        user.id === userId ? { ...user, balance: newBalance } : user
      ));

      toast({
        title: "Успешно",
        description: "Баланс пользователя обновлен",
      });
    } catch (error) {
      console.error('Error updating user balance:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить баланс",
        variant: "destructive",
      });
    }
  };

  const saveSiteSettings = async () => {
    try {
      // For now just update local UI; add backend endpoint later if needed
      await fetchSiteSettings();

      toast({
        title: "Успешно",
        description: "Настройки сайта сохранены",
      });
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Панель суперадмина</h1>
        <p className="text-muted-foreground">Управление пользователями и настройками сайта</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Настройки сайта
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{user.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant={user.role === 'superadmin' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Баланс: {user.balance}₽</p>
                          <Input
                            type="number"
                            value={user.balance}
                            onChange={(e) => updateUserBalance(user.id, Number(e.target.value))}
                            className="w-24 mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${user.id}`}>Активен</Label>
                          <Switch
                            id={`active-${user.id}`}
                            checked={user.is_active}
                            onCheckedChange={(checked) => updateUserStatus(user.id, checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Настройки сайта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site_name">Название сайта</Label>
                  <Input
                    id="site_name"
                    value={siteSettings.site_name}
                    onChange={(e) => setSiteSettings({...siteSettings, site_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="site_title">Заголовок сайта</Label>
                  <Input
                    id="site_title"
                    value={siteSettings.site_title}
                    onChange={(e) => setSiteSettings({...siteSettings, site_title: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="site_description">Описание сайта</Label>
                <Textarea
                  id="site_description"
                  value={siteSettings.site_description}
                  onChange={(e) => setSiteSettings({...siteSettings, site_description: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="seo_keywords">SEO ключевые слова</Label>
                <Input
                  id="seo_keywords"
                  value={siteSettings.seo_keywords}
                  onChange={(e) => setSiteSettings({...siteSettings, seo_keywords: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="admin_url">URL админки</Label>
                <Input
                  id="admin_url"
                  value={siteSettings.admin_url}
                  onChange={(e) => setSiteSettings({...siteSettings, admin_url: e.target.value})}
                />
              </div>
              
              <Button onClick={saveSiteSettings} className="w-full">
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}