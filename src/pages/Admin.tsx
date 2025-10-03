import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
      // First get all user roles - this gives us all users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get additional data for each user
      const usersData = await Promise.all(
        (userRoles || []).map(async (userRole) => {
          // Get profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', userRole.user_id)
            .maybeSingle();

          // Get user management data
          const { data: managementData } = await supabase
            .from('user_management')
            .select('is_active, work_hours_start, work_hours_end, service_rate')
            .eq('user_id', userRole.user_id)
            .maybeSingle();

          // Get user balance
          const { data: balanceData } = await supabase
            .from('user_balance')
            .select('balance')
            .eq('user_id', userRole.user_id)
            .maybeSingle();

          return {
            id: userRole.user_id,
            email: `user-${userRole.user_id.slice(0, 8)}@example.com`,
            display_name: profileData?.display_name || 'Без имени',
            is_active: managementData?.is_active || false,
            balance: Number(balanceData?.balance) || 0,
            role: userRole.role,
            work_hours_start: managementData?.work_hours_start,
            work_hours_end: managementData?.work_hours_end,
            service_rate: Number(managementData?.service_rate) || 0,
          };
        })
      );

      setUsers(usersData);
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
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSiteSettings({
          site_name: data.site_name,
          site_title: data.site_title,
          site_description: data.site_description || '',
          seo_keywords: data.seo_keywords || '',
          admin_url: data.admin_url || '/admin',
          payment_methods: Array.isArray(data.payment_methods) 
            ? data.payment_methods.filter((method): method is string => typeof method === 'string')
            : ['card', 'bank_transfer']
        });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_management')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('user_balance')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (error) throw error;

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
      // Get the existing settings ID
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('site_settings')
          .update(siteSettings)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ ...siteSettings });
        if (error) throw error;
      }

      // Refetch to update the UI
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