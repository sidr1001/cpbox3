# Руководство по развертыванию CrossPost Pro

## Обзор

Это руководство описывает различные способы развертывания приложения CrossPost Pro в продакшене.

## Предварительные требования

- Node.js 18+
- Аккаунт Supabase
- Приложение VK (для интеграции с ВКонтакте)
- Telegram Bot (для интеграции с Telegram)
- Аккаунт на платформе хостинга

## Подготовка к развертыванию

### 1. Настройка Supabase

#### Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения инициализации

#### Выполнение миграций

```bash
# Установка Supabase CLI
npm install -g supabase

# Логин в Supabase
supabase login

# Связывание с проектом
supabase link --project-ref your-project-ref

# Выполнение миграций
supabase db push
```

#### Настройка Edge Functions

```bash
# Деплой Edge Functions
supabase functions deploy publish-telegram
supabase functions deploy publish-vk
supabase functions deploy vk-oauth
```

#### Настройка секретов

```bash
# Добавление секретов для VK OAuth
supabase secrets set VK_CLIENT_ID=your_vk_client_id
supabase secrets set VK_CLIENT_SECRET=your_vk_client_secret
```

### 2. Настройка переменных окружения

Создайте файл `.env.production`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Analytics (опционально)
VITE_GA_TRACKING_ID=your_ga_tracking_id

# Sentry (опционально)
VITE_SENTRY_DSN=your_sentry_dsn

# Другие настройки
VITE_APP_URL=https://your-domain.com
VITE_ENVIRONMENT=production
```

### 3. Сборка приложения

```bash
# Установка зависимостей
npm ci

# Сборка для продакшена
npm run build
```

## Способы развертывания

### 1. Vercel (Рекомендуется)

Vercel обеспечивает отличную производительность и простоту развертывания.

#### Настройка

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Логин в Vercel:
```bash
vercel login
```

3. Создайте файл `vercel.json`:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_GA_TRACKING_ID": "@ga_tracking_id"
  }
}
```

4. Развертывание:
```bash
vercel --prod
```

#### Настройка переменных окружения в Vercel

1. Перейдите в настройки проекта в Vercel Dashboard
2. Добавьте переменные окружения:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GA_TRACKING_ID`
   - `VITE_SENTRY_DSN`

### 2. Netlify

#### Настройка

1. Установите Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Создайте файл `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

3. Развертывание:
```bash
netlify deploy --prod --dir=dist
```

### 3. Docker

#### Создание Dockerfile

```dockerfile
# Многоэтапная сборка
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Продакшен образ
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip сжатие
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA маршрутизация
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Безопасность
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

#### Сборка и запуск

```bash
# Сборка образа
docker build -t crosspost-pro .

# Запуск контейнера
docker run -p 80:80 crosspost-pro
```

### 4. AWS S3 + CloudFront

#### Настройка S3

1. Создайте S3 bucket
2. Настройте статический хостинг
3. Загрузите файлы из папки `dist/`

#### Настройка CloudFront

1. Создайте CloudFront distribution
2. Настройте Origin на S3 bucket
3. Добавьте Custom Error Pages для SPA:
   - Error Code: 403, 404
   - Response Page Path: /index.html
   - HTTP Response Code: 200

### 5. GitHub Pages

#### Настройка

1. Создайте файл `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

2. Добавьте секреты в настройках репозитория

## Настройка домена

### 1. Покупка домена

Рекомендуемые регистраторы:
- Namecheap
- GoDaddy
- Cloudflare

### 2. Настройка DNS

#### Для Vercel/Netlify

1. Добавьте домен в настройках проекта
2. Настройте DNS записи:
   - A record: `@` → IP адрес
   - CNAME: `www` → ваш домен

#### Для собственного сервера

1. Настройте A record на IP сервера
2. Настройте CNAME для www поддомена

### 3. SSL сертификат

Большинство платформ автоматически предоставляют SSL сертификаты:
- Vercel: автоматически
- Netlify: автоматически
- Cloudflare: автоматически

Для собственного сервера используйте Let's Encrypt:
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Мониторинг и аналитика

### 1. Google Analytics

1. Создайте аккаунт Google Analytics
2. Добавьте Tracking ID в переменные окружения
3. Настройте цели и события

### 2. Sentry

1. Создайте проект в Sentry
2. Добавьте DSN в переменные окружения
3. Настройте уведомления об ошибках

### 3. Uptime мониторинг

Рекомендуемые сервисы:
- UptimeRobot
- Pingdom
- StatusCake

## Безопасность

### 1. Настройка CORS

В Supabase Dashboard → Settings → API:
```
https://yourdomain.com
```

### 2. Row Level Security

Убедитесь, что RLS включен для всех таблиц:

```sql
-- Включение RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "Users can view own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. Заголовки безопасности

Добавьте в nginx.conf:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;" always;
```

## Резервное копирование

### 1. База данных

```bash
# Создание резервной копии
supabase db dump --file backup.sql

# Восстановление
supabase db reset --file backup.sql
```

### 2. Файлы

Настройте автоматическое резервное копирование:
- AWS S3 Cross-Region Replication
- Google Cloud Storage
- Azure Blob Storage

## Масштабирование

### 1. CDN

Используйте CDN для статических файлов:
- Cloudflare
- AWS CloudFront
- Google Cloud CDN

### 2. Кэширование

Настройте кэширование:
- Redis для сессий
- CDN для статических ресурсов
- Browser caching

### 3. Мониторинг производительности

- Google PageSpeed Insights
- WebPageTest
- Lighthouse CI

## Обновления

### 1. Автоматические обновления

Настройте CI/CD для автоматического развертывания:
- GitHub Actions
- GitLab CI
- Jenkins

### 2. Blue-Green развертывание

Для минимизации downtime:
1. Разверните новую версию на отдельном окружении
2. Протестируйте новую версию
3. Переключите трафик на новую версию
4. Удалите старую версию

## Troubleshooting

### Частые проблемы

1. **Ошибки CORS**
   - Проверьте настройки CORS в Supabase
   - Убедитесь, что домен добавлен в разрешенные

2. **Проблемы с аутентификацией**
   - Проверьте JWT токены
   - Убедитесь, что RLS настроен правильно

3. **Ошибки Edge Functions**
   - Проверьте логи в Supabase Dashboard
   - Убедитесь, что секреты настроены

4. **Проблемы с производительностью**
   - Используйте CDN
   - Оптимизируйте изображения
   - Включите gzip сжатие

### Логи и отладка

1. **Supabase Logs**
   - Dashboard → Logs
   - Фильтрация по типу и времени

2. **Browser DevTools**
   - Network tab для API запросов
   - Console для ошибок JavaScript

3. **Server Logs**
   - nginx access/error logs
   - Docker logs
   - Cloud provider logs