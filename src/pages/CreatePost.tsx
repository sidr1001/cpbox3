import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  ImageIcon, 
  Video, 
  Link as LinkIcon, 
  Clock, 
  Send,
  Eye,
  Calendar,
  X,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { supabase } from "@/integrations/supabase/client";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [platforms, setPlatforms] = useState({ vk: false, telegram: false });
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState("");
  const [publishing, setPublishing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploading, uploadedFiles, uploadFiles, removeFile, clearFiles } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlatformChange = (platform: "vk" | "telegram") => {
    setPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Войдите в систему для публикации",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Ошибка",
        description: "Добавьте текст поста",
        variant: "destructive",
      });
      return;
    }

    if (!platforms.vk && !platforms.telegram) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну платформу",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);

    try {
      // Create post in database
      const scheduledAt = (isScheduled && scheduleDate && scheduleTime)
        ? (() => {
            const [hh, mm] = (scheduleTime || '00:00').split(':').map(Number)
            // Build a local Date using the selected calendar date and time
            const dt = new Date(
              scheduleDate.getFullYear(),
              scheduleDate.getMonth(),
              scheduleDate.getDate(),
              hh ?? 0,
              mm ?? 0,
              0,
              0
            )
            return dt.toISOString() // store in UTC
          })()
        : null;

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: content.substring(0, 100),
          content,
          media_urls: uploadedFiles.map(f => f.url),
          platforms: Object.keys(platforms).filter(p => platforms[p as keyof typeof platforms]),
          status: isScheduled ? 'scheduled' : 'draft',
          scheduled_at: scheduledAt,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Get user settings for tokens
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError) {
        toast({
          title: "Ошибка",
          description: "Не удалось получить настройки подключения",
          variant: "destructive",
        });
        return;
      }

      // Publish immediately if not scheduled
      if (!isScheduled) {
        const publishPromises = [];

        if (platforms.telegram && settings?.telegram_token && settings?.telegram_chat_id) {
          publishPromises.push(
            supabase.functions.invoke('publish-telegram', {
              body: {
                postId: post.id,
                content,
                media_urls: uploadedFiles.map(f => f.url),
                telegram_token: settings.telegram_token,
                telegram_chat_id: settings.telegram_chat_id,
                // Optional inline buttons (e.g., open link)
                buttons: linkUrl ? [{ text: 'Открыть ссылку', url: linkUrl }] : undefined,
              }
            })
          );
        }

        if (platforms.vk && settings?.vk_token) {
          publishPromises.push(
            supabase.functions.invoke('publish-vk', {
              body: {
                postId: post.id,
                content,
                media_urls: uploadedFiles.map(f => f.url),
                vk_token: settings.vk_token,
              }
            })
          );
        }

        const results = await Promise.allSettled(publishPromises);
        
        // Check for errors and update post status accordingly
        const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason);
        const successes = results.filter(r => r.status === 'fulfilled');
        
        if (errors.length > 0) {
          console.error('Publishing errors:', errors);
          
          // Update post status to error if any platform failed
          await supabase
            .from('posts')
            .update({ 
              status: 'error',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
          
          toast({
            title: "Ошибка публикации",
            description: `Не удалось опубликовать в ${errors.length} из ${results.length} платформ`,
            variant: "destructive",
          });
          return;
        }

        // Update post status to published if all platforms succeeded
        if (successes.length > 0) {
          await supabase
            .from('posts')
            .update({ 
              status: 'published',
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
        }
      }

      toast({
        title: isScheduled ? "Пост запланирован" : "Пост опубликован",
        description: isScheduled 
          ? "Пост будет опубликован в указанное время"
          : "Пост успешно опубликован в выбранных платформах",
      });

      // Reset form
      setContent("");
      setLinkUrl("");
      setPlatforms({ vk: false, telegram: false });
      setIsScheduled(false);
      setScheduleDate(undefined);
      setScheduleTime("");
      clearFiles();

    } catch (error) {
      console.error('Publishing error:', error);
      toast({
        title: "Ошибка публикации",
        description: "Не удалось опубликовать пост",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Создать новый пост</h1>
        <p className="text-muted-foreground">
          Создайте контент для публикации в VK и Telegram
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Контент поста</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Текст поста</Label>
                <Textarea
                  id="content"
                  placeholder="Напишите ваш пост здесь..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[150px] bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Символов: {content.length}
                </p>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Медиафайлы</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    Добавить медиа
                  </Button>
                </div>
                
                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Загружено файлов: {uploadedFiles.length}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="relative group">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={file.url} 
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Video className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="text-xs text-white bg-black/50 rounded px-1 truncate">
                              {file.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label htmlFor="link">Ссылка (опционально)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="link"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="bg-background/50"
                  />
                  <Button variant="outline" size="icon">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Выбор платформ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vk"
                    checked={platforms.vk}
                    onCheckedChange={() => handlePlatformChange("vk")}
                  />
                  <Label htmlFor="vk" className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-vk text-vk">VK</Badge>
                    <span>ВКонтакте</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="telegram"
                    checked={platforms.telegram}
                    onCheckedChange={() => handlePlatformChange("telegram")}
                  />
                  <Label htmlFor="telegram" className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-telegram text-telegram">TG</Badge>
                    <span>Telegram</span>
                  </Label>
                </div>
              </div>

              {/* Schedule Options */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={(checked) => setIsScheduled(checked === true)}
                  />
                  <Label htmlFor="schedule" className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Запланировать публикацию</span>
                  </Label>
                </div>
                
                {isScheduled && (
                  <div className="ml-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Дата публикации</Label>
                      <DatePicker
                        date={scheduleDate}
                        onSelect={setScheduleDate}
                        placeholder="Выберите дату"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Время публикации</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-background/50"
                      />
                      {scheduleDate && scheduleTime && (
                        <p className="text-xs text-muted-foreground">
                          Будет опубликовано: {(() => {
                            const [hh, mm] = (scheduleTime || '00:00').split(':').map(Number)
                            const dt = new Date(
                              scheduleDate.getFullYear(),
                              scheduleDate.getMonth(),
                              scheduleDate.getDate(),
                              hh ?? 0,
                              mm ?? 0,
                              0,
                              0
                            )
                            return dt.toLocaleString()
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <div className="space-y-6">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Превью</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* VK Preview */}
              {platforms.vk && (
                <div className="p-3 rounded-lg border border-vk/20 bg-vk/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="border-vk text-vk">VK</Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {content || "Превью поста для ВКонтакте..."}
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      📷 Медиафайлов: {uploadedFiles.length}
                    </div>
                  )}
                  {linkUrl && (
                    <div className="mt-2 p-2 bg-background/50 rounded border text-xs">
                      🔗 {linkUrl}
                    </div>
                  )}
                </div>
              )}

              {/* Telegram Preview */}
              {platforms.telegram && (
                <div className="p-3 rounded-lg border border-telegram/20 bg-telegram/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="border-telegram text-telegram">TG</Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {content || "Превью поста для Telegram..."}
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      📷 Медиафайлов: {uploadedFiles.length}
                    </div>
                  )}
                  {linkUrl && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Перейти по ссылке
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handlePublish} className="w-full shadow-button" disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Публикация...
                </>
              ) : isScheduled ? (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Запланировать публикацию
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Опубликовать сейчас
                </>
              )}
            </Button>
            
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Сохранить как черновик
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;