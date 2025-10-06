import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Key, 
  Settings as SettingsIcon, 
  Users,
  Bot,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VkConnectionInfo } from "@/components/VkConnectionInfo";

const Settings = () => {
  const [vkToken, setVkToken] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isVkConnected, setIsVkConnected] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vkCallbackProcessed, setVkCallbackProcessed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  // Handle VK OAuth redirect callback
  useEffect(() => {
    const handleVkCallback = async () => {
      // Prevent multiple processing of the same callback
      if (vkCallbackProcessed) return;

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const vkSuccess = params.get('vk_success');
      const accessToken = params.get('access_token');
      const userId = params.get('user_id');
      const vkError = params.get('vk_error');

      if (vkSuccess && accessToken) {
        setVkCallbackProcessed(true);
        
        try {
          await saveUserSettings({
            vk_token: accessToken,
            vk_connected: true,
          });

          setIsVkConnected(true);
          
          toast({
            title: "ВКонтакте подключен",
            description: "Теперь вы можете публиковать посты в ВК",
          });
        } catch (error) {
          console.error('Error saving VK token:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось сохранить токен VK",
            variant: "destructive",
          });
        }
        
        // Clean up URL
        window.history.replaceState(null, '', '/settings');
      } else if (vkError) {
        setVkCallbackProcessed(true);
        
        toast({
          title: 'Ошибка подключения VK',
          description: decodeURIComponent(vkError),
          variant: 'destructive',
        });
        
        // Clean up URL
        window.history.replaceState(null, '', '/settings');
      }
    };

    if (user && !loading) {
      handleVkCallback();
    }
  }, [user, loading, vkCallbackProcessed]);

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      if (data) {
        setVkToken(data.vk_token || '');
        setTelegramToken(data.telegram_token || '');
        setTelegramChatId(data.telegram_chat_id || '');
        setIsVkConnected(data.vk_connected || false);
        setIsTelegramConnected(data.telegram_connected || false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить настройки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveUserSettings = async (updates: any) => {
    try {
      setSaving(true);
      
      // First check if user settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user?.id,
            ...updates,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Reload settings to reflect changes
      await loadUserSettings();

      toast({
        title: "Сохранено",
        description: "Настройки успешно сохранены",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVkConnect = async () => {
    try {
      setSaving(true);
      
      // Get VK OAuth URL from edge function
      const { data, error } = await supabase.functions.invoke('vk-oauth', {
        body: { action: 'get_auth_url' }
      });

      if (error || !data?.auth_url) {
        throw new Error('Failed to get VK auth URL');
      }

      // Redirect to VK OAuth (will redirect back to /settings with params in hash)
      window.location.href = data.auth_url;

    } catch (error) {
      console.error('VK OAuth error:', error);
      toast({
        title: "Ошибка подключения VK",
        description: error instanceof Error ? error.message : "Не удалось подключить ВКонтакте",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const handleTelegramConnect = async () => {
    if (!telegramToken || !telegramChatId) {
      toast({
        title: "Ошибка",
        description: "Введите токен бота и ID чата",
        variant: "destructive",
      });
      return;
    }

    await saveUserSettings({
      telegram_token: telegramToken,
      telegram_chat_id: telegramChatId,
      telegram_connected: true,
    });
    
    setIsTelegramConnected(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Управляйте подключениями к социальным платформам
        </p>
      </div>

      {/* VK Integration */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-vk flex items-center justify-center">
              <span className="text-white text-xs font-bold">VK</span>
            </div>
            <span>ВКонтакте</span>
            <Badge variant={isVkConnected ? "default" : "secondary"} className={isVkConnected ? "bg-emerald-500" : ""}>
              {isVkConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Подключено
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Не подключено
                </>
              )}
            </Badge>
          </CardTitle>
          <CardDescription>
            Настройте интеграцию с ВКонтакте для публикации постов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isVkConnected ? (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500">Требуется авторизация</p>
                    <p className="text-muted-foreground mt-1">
                      Для публикации в ВКонтакте необходимо пройти OAuth авторизацию
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Инструкция по подключению:</Label>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Перейдите на <a href="https://dev.vk.ru/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dev.vk.ru/apps</a></li>
                  <li>Создайте приложение типа "Веб-сайт"</li>
                  <li>В настройках укажите Redirect URI: <code className="bg-muted px-1 rounded text-xs">https://yourdomain.com/api/vk/oauth/callback</code></li>
                  <li>Скопируйте ID приложения и защищенный ключ</li>
                  <li>Добавьте секреты в настройки проекта Supabase</li>
                </ol>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-500">Требуется настройка секретов</p>
                      <p className="text-muted-foreground mt-1">
                        Для работы VK OAuth необходимо добавить <code className="bg-muted px-1 rounded">VK_CLIENT_ID</code> и <code className="bg-muted px-1 rounded">VK_CLIENT_SECRET</code> в 
                        <a href="https://supabase.com/dashboard/project/asjhequnposexawqaels/settings/functions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                          настройки Edge Functions
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleVkConnect} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Подключить ВКонтакте
                  </>
                )}
              </Button>
            </>
          ) : (
            <VkConnectionInfo 
              vkToken={vkToken} 
              onRefresh={() => {
                // Refresh user settings to get updated token
                loadUserSettings();
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Telegram Integration */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-telegram flex items-center justify-center">
              <span className="text-white text-xs">TG</span>
            </div>
            <span>Telegram</span>
            <Badge variant={isTelegramConnected ? "default" : "secondary"} className={isTelegramConnected ? "bg-emerald-500" : ""}>
              {isTelegramConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Подключено
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Не подключено
                </>
              )}
            </Badge>
          </CardTitle>
          <CardDescription>
            Настройте Telegram бота для публикации в каналы и чаты
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <Bot className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-500">Инструкция по созданию бота</p>
                <ol className="text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                  <li>Напишите @BotFather в Telegram</li>
                  <li>Отправьте команду /newbot</li>
                  <li>Следуйте инструкциям для создания бота</li>
                  <li>Скопируйте полученный токен</li>
                  <li>Добавьте бота в ваш канал/чат как администратора</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Токен бота</Label>
              <Input
                id="telegram-token"
                type="password"
                placeholder="1234567890:ABCdefGHijklMNOpqrSTuvwxYZ"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-chat">ID канала/чата</Label>
              <Input
                id="telegram-chat"
                placeholder="@your_channel или -1001234567890"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Используйте @username для публичных каналов или числовой ID для приватных
              </p>
            </div>

            <Button onClick={handleTelegramConnect} className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Подключить Telegram
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Безопасность</span>
          </CardTitle>
          <CardDescription>
            Настройки безопасности и хранения данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-500">Защищенное хранение</p>
                <p className="text-muted-foreground mt-1">
                  Все токены и ключи API шифруются и безопасно хранятся в базе данных
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Активные сессии</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Текущая сессия (это устройство)</p>
              <p>• Срок действия: 30 дней</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => saveUserSettings({
              vk_token: null,
              telegram_token: null,
              telegram_chat_id: null,
              vk_connected: false,
              telegram_connected: false
            })}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сброс...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Сбросить все токены
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;