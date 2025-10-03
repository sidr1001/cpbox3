// Константы приложения
export const APP_CONFIG = {
  name: 'CrossPost Pro',
  version: '1.0.0',
  description: 'Кросс-платформенная публикация контента в VK и Telegram',
  author: 'CrossPost Team',
  repository: 'https://github.com/crosspost/crosspost-pro',
} as const;

// Настройки API
export const API_CONFIG = {
  timeout: 30000, // 30 секунд
  retryAttempts: 3,
  retryDelay: 1000, // 1 секунда
  rateLimit: {
    requests: 100,
    window: 60000, // 1 минута
  },
} as const;

// Настройки кэширования
export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 минут
  maxSize: 100,
  refreshInterval: 60 * 1000, // 1 минута
} as const;

// Настройки файлов
export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
  ],
  maxFiles: 10,
} as const;

// Настройки постов
export const POST_CONFIG = {
  maxContentLength: 4000,
  maxTitleLength: 100,
  maxMediaFiles: 10,
  scheduling: {
    minAdvance: 5 * 60 * 1000, // 5 минут
    maxAdvance: 365 * 24 * 60 * 60 * 1000, // 1 год
  },
} as const;

// Настройки пагинации
export const PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultOffset: 0,
} as const;

// Настройки уведомлений
export const NOTIFICATION_CONFIG = {
  duration: 5000, // 5 секунд
  maxVisible: 5,
  position: 'top-right' as const,
} as const;

// Настройки темы
export const THEME_CONFIG = {
  defaultTheme: 'system' as const,
  storageKey: 'crosspost-theme',
  transitions: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Настройки безопасности
export const SECURITY_CONFIG = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  session: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    refreshThreshold: 7 * 24 * 60 * 60 * 1000, // 7 дней
  },
  rateLimit: {
    login: { requests: 5, window: 15 * 60 * 1000 }, // 5 попыток за 15 минут
    api: { requests: 100, window: 60 * 1000 }, // 100 запросов в минуту
    upload: { requests: 10, window: 60 * 1000 }, // 10 загрузок в минуту
  },
} as const;

// Настройки аналитики
export const ANALYTICS_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  trackingId: process.env.VITE_GA_TRACKING_ID,
  events: {
    postCreated: 'post_created',
    postPublished: 'post_published',
    platformConnected: 'platform_connected',
    userRegistered: 'user_registered',
    errorOccurred: 'error_occurred',
  },
} as const;

// Настройки платформ
export const PLATFORM_CONFIG = {
  vk: {
    name: 'ВКонтакте',
    color: '#0077FF',
    icon: 'VK',
    maxTextLength: 4096,
    maxMediaFiles: 10,
    supportedMediaTypes: ['image', 'video'],
  },
  telegram: {
    name: 'Telegram',
    color: '#0088CC',
    icon: 'TG',
    maxTextLength: 4096,
    maxMediaFiles: 10,
    supportedMediaTypes: ['image', 'video', 'document'],
  },
} as const;

// Настройки ролей
export const ROLE_CONFIG = {
  user: {
    name: 'Пользователь',
    permissions: ['create_posts', 'view_own_posts', 'manage_own_settings'],
  },
  admin: {
    name: 'Администратор',
    permissions: ['create_posts', 'view_all_posts', 'manage_users', 'view_analytics'],
  },
  superadmin: {
    name: 'Супер-администратор',
    permissions: ['*'], // Все разрешения
  },
} as const;

// Настройки статусов постов
export const POST_STATUS_CONFIG = {
  draft: {
    name: 'Черновик',
    color: '#6B7280',
    icon: 'Edit',
  },
  scheduled: {
    name: 'Запланирован',
    color: '#F59E0B',
    icon: 'Clock',
  },
  published: {
    name: 'Опубликован',
    color: '#10B981',
    icon: 'CheckCircle',
  },
  error: {
    name: 'Ошибка',
    color: '#EF4444',
    icon: 'XCircle',
  },
} as const;

// Настройки валидации
export const VALIDATION_CONFIG = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Введите корректный email адрес',
  },
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, а также цифры',
  },
  telegramToken: {
    pattern: /^\d+:[A-Za-z0-9_-]+$/,
    message: 'Неверный формат токена Telegram бота',
  },
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Введите корректный URL',
  },
} as const;

// Настройки локализации
export const LOCALE_CONFIG = {
  default: 'ru',
  supported: ['ru', 'en'],
  fallback: 'ru',
} as const;

// Настройки мониторинга
export const MONITORING_CONFIG = {
  errorReporting: {
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  },
  performance: {
    enabled: process.env.NODE_ENV === 'production',
    sampleRate: 0.1, // 10% трафика
  },
} as const;