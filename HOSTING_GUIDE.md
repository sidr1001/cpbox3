# Руководство по развертыванию CrossPost Pro на обычном хостинге

## 🎯 Обзор

Это руководство описывает пошаговый процесс развертывания CrossPost Pro на обычном веб-хостинге (shared hosting, VPS, dedicated server).

## 📋 Предварительные требования

### Системные требования
- **Node.js**: версия 18+ 
- **npm** или **yarn**
- **Git** для клонирования репозитория
- **SSH доступ** к серверу (для VPS/dedicated)
- **FTP/SFTP доступ** (для shared hosting)

### Аккаунты и сервисы
- **Supabase** аккаунт и проект
- **VK приложение** (для интеграции с ВКонтакте)
- **Telegram Bot** (для интеграции с Telegram)
- **Домен** (опционально, но рекомендуется)

## 🚀 Варианты развертывания

### 1. Shared Hosting (cPanel, Plesk и т.д.)

#### Подготовка
1. Убедитесь, что хостинг поддерживает Node.js
2. Проверьте доступ к терминалу или SSH
3. Подготовьте FTP/SFTP данные

#### Шаги развертывания

```bash
# 1. Подключитесь к серверу через SSH или используйте терминал в cPanel
ssh username@your-server.com

# 2. Перейдите в папку public_html или www
cd public_html

# 3. Клонируйте репозиторий
git clone https://github.com/your-username/crosspost-pro.git
cd crosspost-pro

# 4. Установите зависимости
npm install

# 5. Создайте файл .env.production
nano .env.production
```

#### Содержимое .env.production
```env
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Analytics (опционально)
VITE_GA_TRACKING_ID=your_ga_tracking_id

# Sentry (опционально)
VITE_SENTRY_DSN=your_sentry_dsn

# Другие настройки
VITE_APP_URL=https://yourdomain.com
VITE_ENVIRONMENT=production
```

```bash
# 6. Соберите проект
npm run build

# 7. Настройте веб-сервер для SPA
# Создайте .htaccess файл в папке dist
```

#### .htaccess для Apache
```apache
RewriteEngine On

# Handle Angular and React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

### 2. VPS/Dedicated Server

#### Установка Node.js

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверяем установку
node --version
npm --version
```

#### Установка Nginx

```bash
# Устанавливаем Nginx
sudo apt install nginx -y

# Запускаем и включаем автозапуск
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

#### Настройка проекта

```bash
# Создаем пользователя для приложения
sudo adduser crosspost
sudo usermod -aG sudo crosspost

# Переключаемся на пользователя
su - crosspost

# Создаем папку для приложения
mkdir -p /home/crosspost/apps
cd /home/crosspost/apps

# Клонируем репозиторий
git clone https://github.com/your-username/crosspost-pro.git
cd crosspost-pro

# Устанавливаем зависимости
npm install

# Создаем файл окружения
nano .env.production
```

#### Конфигурация Nginx

```bash
# Создаем конфигурацию сайта
sudo nano /etc/nginx/sites-available/crosspost-pro
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /home/crosspost/apps/crosspost-pro/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;" always;

    # Hide nginx version
    server_tokens off;
}
```

```bash
# Активируем сайт
sudo ln -s /etc/nginx/sites-available/crosspost-pro /etc/nginx/sites-enabled/

# Удаляем дефолтный сайт
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем Nginx
sudo systemctl reload nginx
```

#### Сборка и развертывание

```bash
# Собираем проект
npm run build

# Устанавливаем права доступа
sudo chown -R www-data:www-data /home/crosspost/apps/crosspost-pro/dist
sudo chmod -R 755 /home/crosspost/apps/crosspost-pro/dist
```

### 3. Docker развертывание

#### Создание Dockerfile

```dockerfile
# Многоэтапная сборка
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Продакшен образ
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf для Docker

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  crosspost-pro:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_GA_TRACKING_ID=${VITE_GA_TRACKING_ID}
    restart: unless-stopped
```

#### Развертывание с Docker

```bash
# Создаем .env файл
echo "VITE_SUPABASE_URL=https://your-project-ref.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env
echo "VITE_GA_TRACKING_ID=your_ga_tracking_id" >> .env

# Собираем и запускаем
docker-compose up -d --build

# Проверяем статус
docker-compose ps
```

## 🔧 Настройка Supabase

### 1. Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения инициализации

### 2. Настройка базы данных

```bash
# Устанавливаем Supabase CLI
npm install -g supabase

# Логинимся
supabase login

# Связываем с проектом
supabase link --project-ref your-project-ref

# Выполняем миграции
supabase db push
```

### 3. Настройка Edge Functions

```bash
# Развертываем функции
supabase functions deploy publish-telegram
supabase functions deploy publish-vk
supabase functions deploy vk-oauth
supabase functions deploy vk-user-info

# Настраиваем секреты
supabase secrets set VK_CLIENT_ID=your_vk_client_id
supabase secrets set VK_CLIENT_SECRET=your_vk_client_secret
```

### 4. Настройка CORS

В Supabase Dashboard → Settings → API добавьте ваш домен:
```
https://yourdomain.com
```

## 🔐 Настройка SSL сертификата

### Let's Encrypt (для VPS/Dedicated)

```bash
# Устанавливаем Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получаем сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Проверяем автообновление
sudo certbot renew --dry-run
```

### Cloudflare (рекомендуется)

1. Зарегистрируйтесь на [cloudflare.com](https://cloudflare.com)
2. Добавьте ваш домен
3. Измените DNS записи на Cloudflare
4. Включите SSL/TLS в режиме "Full (strict)"

## 📊 Мониторинг и логирование

### Настройка логирования

```bash
# Создаем папку для логов
sudo mkdir -p /var/log/crosspost-pro
sudo chown www-data:www-data /var/log/crosspost-pro

# Настраиваем ротацию логов
sudo nano /etc/logrotate.d/crosspost-pro
```

```bash
/var/log/crosspost-pro/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

### Мониторинг производительности

```bash
# Устанавливаем htop для мониторинга
sudo apt install htop -y

# Устанавливаем nginx monitoring
sudo apt install nginx-module-njs -y
```

## 🚀 Автоматическое развертывание

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

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
        VITE_GA_TRACKING_ID: ${{ secrets.VITE_GA_TRACKING_ID }}
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /home/crosspost/apps/crosspost-pro
          git pull origin main
          npm ci
          npm run build
          sudo systemctl reload nginx
```

### Скрипт автоматического развертывания

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Переходим в папку проекта
cd /home/crosspost/apps/crosspost-pro

# Получаем последние изменения
echo "📥 Pulling latest changes..."
git pull origin main

# Устанавливаем зависимости
echo "📦 Installing dependencies..."
npm ci

# Собираем проект
echo "🔨 Building project..."
npm run build

# Перезагружаем nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed!"
```

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh

# Запускаем развертывание
./deploy.sh
```

## 🔍 Отладка и решение проблем

### Частые проблемы

#### 1. Ошибка 404 на всех страницах кроме главной
**Решение**: Проверьте настройки SPA routing в nginx/apache

#### 2. Ошибки CORS
**Решение**: Добавьте домен в настройки CORS в Supabase

#### 3. Медленная загрузка
**Решение**: Включите gzip сжатие и кэширование

#### 4. Ошибки Edge Functions
**Решение**: Проверьте логи в Supabase Dashboard

### Команды для отладки

```bash
# Проверка статуса nginx
sudo systemctl status nginx

# Просмотр логов nginx
sudo tail -f /var/log/nginx/error.log

# Проверка конфигурации nginx
sudo nginx -t

# Проверка портов
sudo netstat -tlnp | grep :80

# Проверка процессов Node.js
ps aux | grep node
```

## 📈 Оптимизация производительности

### 1. Настройка кэширования

```nginx
# В nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### 2. Сжатие файлов

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. CDN (Cloudflare)

1. Включите Cloudflare для вашего домена
2. Настройте кэширование статических файлов
3. Включите Brotli сжатие

## 🔒 Безопасность

### 1. Настройка файрвола

```bash
# Устанавливаем UFW
sudo apt install ufw -y

# Настраиваем правила
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Включаем файрвол
sudo ufw enable
```

### 2. Обновление системы

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Мониторинг безопасности

```bash
# Устанавливаем fail2ban
sudo apt install fail2ban -y

# Настраиваем для nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

## 📞 Поддержка и обслуживание

### Регулярные задачи

1. **Еженедельно**: Проверка логов и производительности
2. **Ежемесячно**: Обновление зависимостей
3. **Ежеквартально**: Обновление системы и безопасности

### Резервное копирование

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/crosspost/backups"
PROJECT_DIR="/home/crosspost/apps/crosspost-pro"

# Создаем папку для бэкапов
mkdir -p $BACKUP_DIR

# Создаем архив проекта
tar -czf $BACKUP_DIR/crosspost-pro_$DATE.tar.gz -C $PROJECT_DIR .

# Удаляем старые бэкапы (старше 30 дней)
find $BACKUP_DIR -name "crosspost-pro_*.tar.gz" -mtime +30 -delete

echo "Backup completed: crosspost-pro_$DATE.tar.gz"
```

---

## 🎉 Заключение

После выполнения всех шагов у вас будет полностью рабочее приложение CrossPost Pro на вашем хостинге. Не забудьте:

1. ✅ Протестировать все функции
2. ✅ Настроить мониторинг
3. ✅ Создать резервные копии
4. ✅ Настроить автоматическое развертывание
5. ✅ Документировать процесс для команды

**Удачи с развертыванием! 🚀**