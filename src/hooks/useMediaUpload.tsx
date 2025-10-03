import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFiles = async (files: FileList | File[]) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Войдите в систему для загрузки файлов",
        variant: "destructive",
      });
      return [];
    }

    setUploading(true);
    const filesArray = Array.from(files);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of filesArray) {
        // Validate file type and size
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          toast({
            title: "Неподдерживаемый формат",
            description: `Файл ${file.name} не является изображением или видео`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          toast({
            title: "Файл слишком большой",
            description: `Файл ${file.name} превышает лимит 50MB`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        const uploadedFile: UploadedFile = {
          id: data.path,
          url: publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        };

        uploadedFiles.push(uploadedFile);
      }

      if (uploadedFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...uploadedFiles]);
        toast({
          title: "Загрузка завершена",
          description: `Загружено файлов: ${uploadedFiles.length}`,
        });
      }

      return uploadedFiles;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });
      return [];
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from('media')
        .remove([fileId]);

      if (error) {
        console.error('Delete error:', error);
      }

      // Remove from local state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: "Файл удален",
        description: "Файл успешно удален",
      });

    } catch (error) {
      console.error('Remove file error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить файл",
        variant: "destructive",
      });
    }
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  return {
    uploading,
    uploadedFiles,
    uploadFiles,
    removeFile,
    clearFiles,
    setUploadedFiles,
  };
};