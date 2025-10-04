# Развертывание CrossPost Pro без Supabase

## 🎯 Обзор

Это руководство описывает развертывание CrossPost Pro с собственным backend вместо Supabase.

## 🏗️ Архитектура

### Frontend (React + Vite)
- Пользовательский интерфейс
- Аутентификация
- Управление постами

### Backend (Node.js + Express)
- REST API
- Аутентификация (JWT)
- База данных (PostgreSQL/MySQL)
- Интеграция с VK и Telegram

## 📋 Предварительные требования

- Node.js 18+
- PostgreSQL или MySQL
- Redis (для сессий, опционально)
- VK приложение
- Telegram Bot

## 🚀 Создание backend

### 1. Структура проекта

```
crosspost-pro/
├── frontend/          # React приложение
├── backend/           # Node.js API
├── database/          # Миграции и схемы
└── docker-compose.yml # Для разработки
```

### 2. Backend API (Node.js + Express)

#### package.json
```json
{
  "name": "crosspost-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.0",
    "mysql2": "^3.6.0",
    "multer": "^1.4.5",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^6.8.1",
    "express-validator": "^7.0.1"
  }
}
```

#### server.js
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const settingsRoutes = require('./routes/settings');
const vkRoutes = require('./routes/vk');
const telegramRoutes = require('./routes/telegram');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vk', vkRoutes);
app.use('/api/telegram', telegramRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. База данных (PostgreSQL)

#### database/schema.sql
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vk_token TEXT,
    vk_connected BOOLEAN DEFAULT FALSE,
    telegram_token TEXT,
    telegram_chat_id VARCHAR(255),
    telegram_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    platforms TEXT[] NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    media_urls TEXT[],
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    vk_post_id VARCHAR(255),
    telegram_message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User balance table
CREATE TABLE user_balance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions table
CREATE TABLE payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

### 4. Аутентификация

#### routes/auth.js
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('displayName').optional().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, role',
      [email, passwordHash, displayName]
    );

    const user = result.rows[0];

    // Create user settings and balance
    await db.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    await db.query(
      'INSERT INTO user_balance (user_id) VALUES ($1)',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, display_name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 5. API для постов

#### routes/posts.js
```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user posts
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM posts WHERE user_id = $1';
    let params = [req.user.userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create post
router.post('/', auth, [
  body('title').isLength({ min: 1, max: 255 }),
  body('content').optional().isLength({ max: 4000 }),
  body('platforms').isArray({ min: 1 }),
  body('scheduled_at').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, platforms, media_urls, scheduled_at } = req.body;

    const result = await db.query(
      `INSERT INTO posts (user_id, title, content, platforms, media_urls, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        title,
        content,
        platforms,
        media_urls || [],
        scheduled_at,
        scheduled_at ? 'scheduled' : 'draft'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish post
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get post
    const postResult = await db.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    // Get user settings
    const settingsResult = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.userId]
    );

    const settings = settingsResult.rows[0];

    // Publish to platforms
    const publishResults = [];

    if (post.platforms.includes('vk') && settings.vk_connected) {
      try {
        const vkResult = await publishToVK(post, settings.vk_token);
        publishResults.push({ platform: 'vk', success: true, result: vkResult });
        
        await db.query(
          'UPDATE posts SET vk_post_id = $1 WHERE id = $2',
          [vkResult.post_id, id]
        );
      } catch (error) {
        publishResults.push({ platform: 'vk', success: false, error: error.message });
      }
    }

    if (post.platforms.includes('telegram') && settings.telegram_connected) {
      try {
        const telegramResult = await publishToTelegram(post, settings.telegram_token, settings.telegram_chat_id);
        publishResults.push({ platform: 'telegram', success: true, result: telegramResult });
        
        await db.query(
          'UPDATE posts SET telegram_message_id = $1 WHERE id = $2',
          [telegramResult.message_id, id]
        );
      } catch (error) {
        publishResults.push({ platform: 'telegram', success: false, error: error.message });
      }
    }

    // Update post status
    const allSuccessful = publishResults.every(r => r.success);
    const status = allSuccessful ? 'published' : 'error';

    await db.query(
      'UPDATE posts SET status = $1, published_at = $2 WHERE id = $3',
      [status, new Date().toISOString(), id]
    );

    res.json({
      success: allSuccessful,
      results: publishResults,
      status
    });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function publishToVK(post, vkToken) {
  const axios = require('axios');
  
  const response = await axios.post('https://api.vk.ru/method/wall.post', {
    access_token: vkToken,
    v: '5.131',
    message: post.content,
    from_group: '0'
  });

  if (response.data.error) {
    throw new Error(`VK API error: ${response.data.error.error_msg}`);
  }

  return response.data.response;
}

async function publishToTelegram(post, telegramToken, chatId) {
  const axios = require('axios');
  
  const response = await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    chat_id: chatId,
    text: post.content,
    parse_mode: 'HTML'
  });

  if (!response.data.ok) {
    throw new Error(`Telegram API error: ${response.data.description}`);
  }

  return response.data.result;
}

module.exports = router;
```

### 6. Frontend изменения

#### src/lib/api.js
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/auth';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async register(email, password, displayName) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.token) {
      this.setToken(result.token);
    }
    
    return result;
  }

  // Posts methods
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/posts?${query}`);
  }

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async publishPost(postId) {
    return this.request(`/posts/${postId}/publish`, {
      method: 'POST',
    });
  }

  // Settings methods
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();
```

### 7. Docker Compose для разработки

#### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: crosspost
      POSTGRES_USER: crosspost
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://crosspost:password@postgres:5432/crosspost
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key
      - VK_CLIENT_ID=your_vk_client_id
      - VK_CLIENT_SECRET=your_vk_client_secret
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## 🚀 Развертывание

### 1. Подготовка сервера

```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Установка Nginx
sudo apt install nginx -y
```

### 2. Настройка базы данных

```bash
# Создание пользователя и базы
sudo -u postgres psql
CREATE USER crosspost WITH PASSWORD 'secure_password';
CREATE DATABASE crosspost OWNER crosspost;
GRANT ALL PRIVILEGES ON DATABASE crosspost TO crosspost;
\q

# Выполнение миграций
psql -h localhost -U crosspost -d crosspost -f database/schema.sql
```

### 3. Настройка backend

```bash
# Клонирование проекта
git clone https://github.com/your-username/crosspost-pro.git
cd crosspost-pro/backend

# Установка зависимостей
npm install

# Создание .env файла
nano .env
```

#### .env файл
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://crosspost:secure_password@localhost:5432/crosspost
JWT_SECRET=your-super-secret-jwt-key-change-this
VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret
FRONTEND_URL=https://yourdomain.com
```

### 4. Настройка frontend

```bash
cd ../frontend

# Установка зависимостей
npm install

# Создание .env файла
nano .env.production
```

#### .env.production
```env
VITE_API_URL=https://yourdomain.com/api
VITE_GA_TRACKING_ID=your_ga_tracking_id
```

```bash
# Сборка frontend
npm run build
```

### 5. Настройка Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /path/to/crosspost-pro/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Systemd сервис

```bash
# Создание сервиса
sudo nano /etc/systemd/system/crosspost-backend.service
```

```ini
[Unit]
Description=CrossPost Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/crosspost-pro/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Запуск сервиса
sudo systemctl daemon-reload
sudo systemctl enable crosspost-backend
sudo systemctl start crosspost-backend
```

## 🔧 Дополнительные настройки

### 1. SSL сертификат

```bash
# Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### 2. Мониторинг

```bash
# PM2 для управления процессами
npm install -g pm2
pm2 start server.js --name crosspost-backend
pm2 startup
pm2 save
```

### 3. Резервное копирование

```bash
#!/bin/bash
# backup.sh
pg_dump -h localhost -U crosspost crosspost > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📊 Мониторинг и логирование

### 1. Логирование

```javascript
// backend/middleware/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. Мониторинг производительности

```javascript
// backend/middleware/metrics.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

module.exports = { httpRequestDuration, httpRequestTotal };
```

## 🎉 Заключение

Теперь у вас есть полностью автономное приложение CrossPost Pro без зависимости от Supabase:

✅ **Собственный backend** на Node.js + Express  
✅ **База данных PostgreSQL** с полной схемой  
✅ **JWT аутентификация**  
✅ **API для VK и Telegram**  
✅ **Готовое к продакшену** развертывание  

Все готово для развертывания на любом хостинге! 🚀