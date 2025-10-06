# API Документация CrossPost Pro

## Обзор

CrossPost Pro использует Supabase в качестве Backend-as-a-Service платформы. API построен на основе PostgreSQL с использованием PostgREST для автоматической генерации REST API.

## Базовый URL

```
https://yourdomain.com/api/
```

## Аутентификация

Все API запросы требуют аутентификации через JWT токен в заголовке `Authorization`:

```
Authorization: Bearer <jwt_token>
```

### Получение токена

```typescript
// Регистрация
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      display_name: 'Имя пользователя'
    }
  }
});

// Вход
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

## Таблицы базы данных

### posts

Хранит информацию о постах пользователей.

#### Структура

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Уникальный идентификатор |
| user_id | uuid | ID пользователя |
| title | text | Заголовок поста |
| content | text | Содержимое поста |
| platforms | text[] | Платформы для публикации |
| status | text | Статус поста |
| media_urls | text[] | URL медиафайлов |
| scheduled_at | timestamptz | Время запланированной публикации |
| published_at | timestamptz | Время публикации |
| created_at | timestamptz | Время создания |
| updated_at | timestamptz | Время обновления |
| vk_post_id | text | ID поста в VK |
| telegram_message_id | text | ID сообщения в Telegram |

#### Статусы постов

- `draft` - Черновик
- `scheduled` - Запланирован
- `published` - Опубликован
- `error` - Ошибка публикации

#### API методы

##### Создание поста

```typescript
POST /posts
Content-Type: application/json

{
  "title": "Заголовок поста",
  "content": "Содержимое поста",
  "platforms": ["vk", "telegram"],
  "media_urls": ["https://example.com/image.jpg"],
  "scheduled_at": "2024-01-01T12:00:00Z"
}
```

##### Получение постов

```typescript
GET /posts?user_id=eq.{user_id}&order=created_at.desc&limit=20&offset=0
```

##### Обновление поста

```typescript
PATCH /posts?id=eq.{post_id}
Content-Type: application/json

{
  "title": "Новый заголовок",
  "content": "Новое содержимое"
}
```

##### Удаление поста

```typescript
DELETE /posts?id=eq.{post_id}
```

### user_settings

Хранит настройки пользователей для интеграции с социальными платформами.

#### Структура

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Уникальный идентификатор |
| user_id | uuid | ID пользователя |
| vk_connected | boolean | Подключен ли VK |
| telegram_connected | boolean | Подключен ли Telegram |
| vk_token | text | Токен VK |
| telegram_token | text | Токен Telegram бота |
| telegram_chat_id | text | ID чата Telegram |
| created_at | timestamptz | Время создания |
| updated_at | timestamptz | Время обновления |

#### API методы

##### Получение настроек

```typescript
GET /user_settings?user_id=eq.{user_id}
```

##### Обновление настроек

```typescript
PATCH /user_settings?user_id=eq.{user_id}
Content-Type: application/json

{
  "telegram_token": "bot_token",
  "telegram_chat_id": "chat_id",
  "telegram_connected": true
}
```

### user_balance

Хранит баланс пользователей.

#### Структура

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Уникальный идентификатор |
| user_id | uuid | ID пользователя |
| balance | numeric | Баланс пользователя |
| created_at | timestamptz | Время создания |
| updated_at | timestamptz | Время обновления |

#### API методы

##### Получение баланса

```typescript
GET /user_balance?user_id=eq.{user_id}
```

##### Обновление баланса

```typescript
PATCH /user_balance?user_id=eq.{user_id}
Content-Type: application/json

{
  "balance": 100.50
}
```

### payment_transactions

Хранит информацию о платежных транзакциях.

#### Структура

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Уникальный идентификатор |
| user_id | uuid | ID пользователя |
| amount | numeric | Сумма транзакции |
| status | text | Статус транзакции |
| payment_method | text | Способ оплаты |
| transaction_id | text | ID транзакции |
| created_at | timestamptz | Время создания |
| updated_at | timestamptz | Время обновления |

### user_roles

Хранит роли пользователей.

#### Структура

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Уникальный идентификатор |
| user_id | uuid | ID пользователя |
| role | user_role | Роль пользователя |
| created_at | timestamptz | Время создания |
| updated_at | timestamptz | Время обновления |

#### Роли

- `user` - Обычный пользователь
- `admin` - Администратор
- `superadmin` - Супер-администратор

### site_settings

Хранит настройки сайта.

#### Структура

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Уникальный идентификатор |
| site_name | text | Название сайта |
| site_title | text | Заголовок сайта |
| site_description | text | Описание сайта |
| seo_keywords | text | SEO ключевые слова |
| admin_url | text | URL админ панели |
| payment_methods | jsonb | Настройки платежных методов |
| created_at | timestamptz | Время создания |
| updated_at | timestamptz | Время обновления |

## Edge Functions

### publish-telegram

Публикует пост в Telegram.

#### Endpoint

```
POST /functions/v1/publish-telegram
```

#### Параметры

```typescript
{
  "postId": "uuid",
  "content": "string",
  "media_urls": ["string"],
  "telegram_token": "string",
  "telegram_chat_id": "string",
  "buttons": [
    {
      "text": "string",
      "url": "string"
    }
  ]
}
```

#### Ответ

```typescript
{
  "success": true,
  "telegram_message_id": "string"
}
```

### publish-vk

Публикует пост в ВКонтакте.

#### Endpoint

```
POST /functions/v1/publish-vk
```

#### Параметры

```typescript
{
  "postId": "uuid",
  "content": "string",
  "media_urls": ["string"],
  "vk_token": "string"
}
```

#### Ответ

```typescript
{
  "success": true,
  "vk_post_id": "string"
}
```

### vk-oauth

Обрабатывает OAuth авторизацию ВКонтакте.

#### Endpoint

```
POST /functions/v1/vk-oauth
```

#### Параметры

```typescript
{
  "action": "get_auth_url"
}
```

#### Ответ

```typescript
{
  "auth_url": "string"
}
```

## Фильтрация и сортировка

### Операторы фильтрации

- `eq` - Равно
- `neq` - Не равно
- `gt` - Больше
- `gte` - Больше или равно
- `lt` - Меньше
- `lte` - Меньше или равно
- `like` - Похоже на
- `ilike` - Похоже на (без учета регистра)
- `in` - В списке
- `is` - Проверка на null

### Примеры фильтрации

```typescript
// Получить посты пользователя
GET /posts?user_id=eq.{user_id}

// Получить опубликованные посты
GET /posts?status=eq.published

// Поиск по заголовку
GET /posts?title=ilike.%заголовок%

// Получить посты за последний месяц
GET /posts?created_at=gte.2024-01-01T00:00:00Z

// Получить посты с медиафайлами
GET /posts?media_urls=not.is.null
```

### Сортировка

```typescript
// Сортировка по дате создания (по убыванию)
GET /posts?order=created_at.desc

// Сортировка по нескольким полям
GET /posts?order=status.asc,created_at.desc
```

### Пагинация

```typescript
// Получить первые 20 записей
GET /posts?limit=20&offset=0

// Получить следующие 20 записей
GET /posts?limit=20&offset=20
```

## Обработка ошибок

### Коды ошибок

- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `409` - Конфликт
- `422` - Ошибка валидации
- `500` - Внутренняя ошибка сервера

### Формат ошибки

```typescript
{
  "code": "string",
  "message": "string",
  "details": "string",
  "hint": "string"
}
```

## Rate Limiting

API имеет ограничения на количество запросов:

- **Аутентификация**: 5 запросов в 15 минут
- **API**: 100 запросов в минуту
- **Загрузка файлов**: 10 запросов в минуту

При превышении лимита возвращается ошибка `429 Too Many Requests`.

## Webhooks

### Подписка на изменения

```typescript
// Подписка на изменения постов
const channel = supabase
  .channel('posts_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Post changed:', payload);
  })
  .subscribe();
```

## Примеры использования

### Создание и публикация поста

```typescript
// 1. Создать пост
const { data: post, error: postError } = await supabase
  .from('posts')
  .insert({
    title: 'Мой пост',
    content: 'Содержимое поста',
    platforms: ['vk', 'telegram'],
    status: 'draft'
  })
  .select()
  .single();

// 2. Получить настройки пользователя
const { data: settings } = await supabase
  .from('user_settings')
  .select('*')
  .eq('user_id', userId)
  .single();

// 3. Опубликовать в Telegram
if (settings.telegram_connected) {
  await supabase.functions.invoke('publish-telegram', {
    body: {
      postId: post.id,
      content: post.content,
      telegram_token: settings.telegram_token,
      telegram_chat_id: settings.telegram_chat_id
    }
  });
}

// 4. Опубликовать в VK
if (settings.vk_connected) {
  await supabase.functions.invoke('publish-vk', {
    body: {
      postId: post.id,
      content: post.content,
      vk_token: settings.vk_token
    }
  });
}
```

### Получение статистики пользователя

```typescript
// Получить все посты пользователя
const { data: posts } = await supabase
  .from('posts')
  .select('status, created_at')
  .eq('user_id', userId);

// Подсчитать статистику
const stats = {
  total: posts.length,
  published: posts.filter(p => p.status === 'published').length,
  scheduled: posts.filter(p => p.status === 'scheduled').length,
  draft: posts.filter(p => p.status === 'draft').length,
  error: posts.filter(p => p.status === 'error').length
};
```