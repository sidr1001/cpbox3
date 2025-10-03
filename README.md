# CrossPost Pro

> Современное веб-приложение для кросс-платформенной публикации контента в социальных сетях

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## 🚀 Возможности

- **Кросс-платформенная публикация**: Одновременная публикация в VK и Telegram
- **Планировщик постов**: Запланируйте публикацию на удобное время
- **Медиа-контент**: Поддержка изображений и видео
- **Аналитика**: Отслеживание статистики публикаций
- **Безопасность**: Защищенное хранение токенов и данных
- **Современный UI**: Красивый и интуитивный интерфейс

## 🛠️ Технологии

### Frontend
- **React 18** - Современная библиотека для создания пользовательских интерфейсов
- **TypeScript** - Типизированный JavaScript для лучшей разработки
- **Vite** - Быстрый инструмент сборки
- **Tailwind CSS** - Utility-first CSS фреймворк
- **shadcn/ui** - Современные компоненты UI
- **React Router** - Маршрутизация в React приложениях
- **React Query** - Управление состоянием сервера

### Backend
- **Supabase** - Backend-as-a-Service платформа
- **PostgreSQL** - Реляционная база данных
- **Edge Functions** - Серверные функции на Deno
- **Row Level Security** - Безопасность на уровне строк

### Интеграции
- **VK API** - API ВКонтакте для публикации постов
- **Telegram Bot API** - API Telegram для публикации в каналы

## 📦 Установка

### Предварительные требования

- Node.js 18+ 
- npm или yarn
- Аккаунт Supabase
- Приложение VK (для интеграции с ВКонтакте)
- Telegram Bot (для интеграции с Telegram)

### Клонирование репозитория

```bash
git clone https://github.com/your-username/crosspost-pro.git
cd crosspost-pro
```

### Установка зависимостей

```bash
npm install
# или
yarn install
```

### Настройка окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Analytics (опционально)
VITE_GA_TRACKING_ID=your_ga_tracking_id

# Sentry (опционально)
VITE_SENTRY_DSN=your_sentry_dsn
```

### Настройка Supabase

1. Создайте новый проект в [Supabase](https://supabase.com)
2. Выполните миграции из папки `supabase/migrations/`
3. Настройте Edge Functions из папки `supabase/functions/`
4. Добавьте секреты для VK OAuth в настройки Edge Functions:
   - `VK_CLIENT_ID` - ID вашего VK приложения
   - `VK_CLIENT_SECRET` - Секретный ключ VK приложения

### Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Приложение будет доступно по адресу `http://localhost:8080`

## 🏗️ Сборка для продакшена

```bash
npm run build
# или
yarn build
```

Собранные файлы будут в папке `dist/`

## 📁 Структура проекта

```
crosspost-pro/
├── public/                 # Статические файлы
├── src/
│   ├── components/         # React компоненты
│   │   ├── ui/            # UI компоненты
│   │   └── Layout.tsx     # Основной макет
│   ├── hooks/             # Пользовательские хуки
│   ├── integrations/      # Интеграции с внешними сервисами
│   │   └── supabase/      # Supabase клиент и типы
│   ├── lib/               # Утилиты и конфигурация
│   ├── pages/             # Страницы приложения
│   ├── types/             # TypeScript типы
│   └── utils/             # Вспомогательные функции
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Миграции базы данных
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 🔧 API Документация

### Аутентификация

#### Регистрация пользователя
```typescript
POST /auth/v1/signup
{
  "email": "user@example.com",
  "password": "password123",
  "options": {
    "data": {
      "display_name": "Имя пользователя"
    }
  }
}
```

#### Вход в систему
```typescript
POST /auth/v1/token?grant_type=password
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Посты

#### Создание поста
```typescript
POST /rest/v1/posts
{
  "title": "Заголовок поста",
  "content": "Содержимое поста",
  "platforms": ["vk", "telegram"],
  "media_urls": ["https://example.com/image.jpg"],
  "scheduled_at": "2024-01-01T12:00:00Z"
}
```

#### Получение постов пользователя
```typescript
GET /rest/v1/posts?user_id=eq.{user_id}&order=created_at.desc
```

### Настройки пользователя

#### Обновление настроек
```typescript
PATCH /rest/v1/user_settings?user_id=eq.{user_id}
{
  "telegram_token": "bot_token",
  "telegram_chat_id": "chat_id",
  "telegram_connected": true
}
```

## 🔐 Безопасность

### Аутентификация
- JWT токены с автоматическим обновлением
- Защищенные маршруты
- Row Level Security в Supabase

### Валидация данных
- Валидация на клиенте с Zod
- Санитизация HTML контента
- Проверка типов файлов и размеров

### Rate Limiting
- Ограничение количества запросов
- Защита от спама и злоупотреблений

## 🧪 Тестирование

```bash
# Запуск тестов
npm run test

# Запуск тестов с покрытием
npm run test:coverage

# Запуск E2E тестов
npm run test:e2e
```

## 📊 Мониторинг

### Аналитика
- Google Analytics интеграция
- Отслеживание пользовательских действий
- Метрики производительности

### Логирование
- Структурированное логирование
- Отслеживание ошибок
- Мониторинг производительности

## 🚀 Развертывание

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Docker
```bash
docker build -t crosspost-pro .
docker run -p 3000:3000 crosspost-pro
```

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](https://github.com/your-username/crosspost-pro/issues)
2. Создайте новый Issue с подробным описанием
3. Свяжитесь с нами через email: support@crosspost.pro

## 🙏 Благодарности

- [Supabase](https://supabase.com) за отличную Backend-as-a-Service платформу
- [shadcn/ui](https://ui.shadcn.com) за красивые компоненты
- [Vite](https://vitejs.dev) за быструю сборку
- [Tailwind CSS](https://tailwindcss.com) за utility-first CSS

---

Сделано с ❤️ командой CrossPost Pro