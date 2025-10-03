// Базовые типы для приложения
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  platforms: Platform[];
  status: PostStatus;
  media_urls: string[] | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  vk_post_id: string | null;
  telegram_message_id: string | null;
}

export type Platform = 'vk' | 'telegram';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'error';

export interface UserSettings {
  id: string;
  user_id: string;
  vk_connected: boolean | null;
  telegram_connected: boolean | null;
  vk_token: string | null;
  telegram_token: string | null;
  telegram_chat_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  site_title: string;
  site_description: string | null;
  seo_keywords: string | null;
  admin_url: string | null;
  payment_methods: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Типы для API ответов
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// Типы для форм
export interface CreatePostForm {
  content: string;
  platforms: Platform[];
  media_urls?: string[];
  scheduled_at?: string;
  link_url?: string;
}

export interface SettingsForm {
  telegram_token?: string;
  telegram_chat_id?: string;
}

export interface AuthForm {
  email: string;
  password: string;
  displayName?: string;
}

// Типы для статистики
export interface UserStats {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  error: number;
  thisWeek: number;
  platforms: {
    vk: number;
    telegram: number;
  };
}

// Типы для медиафайлов
export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

// Типы для уведомлений
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Типы для событий
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: string;
  user_id?: string;
}

// Типы для конфигурации
export interface AppConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    vkIntegration: boolean;
    telegramIntegration: boolean;
    payments: boolean;
    analytics: boolean;
  };
}

// Утилитарные типы
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Типы для хуков
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UsePaginationState<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  error: Error | null;
}

// Типы для компонентов
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error: Error;
  onRetry?: () => void;
}

// Типы для контекста
export interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Типы для роутинга
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
}

// Типы для валидации
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}