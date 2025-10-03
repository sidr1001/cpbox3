import { z } from 'zod';

// Схемы валидации для форм
export const postSchema = z.object({
  content: z.string()
    .min(1, 'Текст поста не может быть пустым')
    .max(4000, 'Текст поста не может превышать 4000 символов'),
  platforms: z.array(z.enum(['vk', 'telegram']))
    .min(1, 'Выберите хотя бы одну платформу'),
  media_urls: z.array(z.string().url()).optional(),
  scheduled_at: z.string().datetime().optional(),
  link_url: z.string().url().optional().or(z.literal('')),
});

export const settingsSchema = z.object({
  telegram_token: z.string()
    .regex(/^\d+:[A-Za-z0-9_-]+$/, 'Неверный формат токена Telegram бота')
    .optional(),
  telegram_chat_id: z.string()
    .min(1, 'ID чата не может быть пустым')
    .optional(),
});

export const authSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать заглавные и строчные буквы, а также цифры'),
  displayName: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
});

// Утилиты для валидации
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Произошла ошибка валидации' } };
  }
};

// Санитизация HTML контента
export const sanitizeHtml = (html: string): string => {
  // Простая санитизация - в реальном проекте используйте DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Валидация URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Валидация файлов
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Размер файла не должен превышать 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Неподдерживаемый тип файла' };
  }
  
  return { valid: true };
};