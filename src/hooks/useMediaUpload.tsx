import { useState } from 'react';
// Replace Supabase storage with your own storage upload API if needed
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

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

        // Batch upload via API
        const res = await apiClient.uploadMedia([file]);
        const uploaded = res?.files?.[0];
        if (!uploaded) {
          toast({ title: 'Ошибка загрузки', description: `Не удалось загрузить ${file.name}`, variant: 'destructive' });
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: uploaded.id,
          url: uploaded.url,
          name: uploaded.name,
          type: uploaded.type,
          size: uploaded.size,
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
      // TODO: implement deletion from your storage

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