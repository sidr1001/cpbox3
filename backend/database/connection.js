const { Pool } = require('pg');

const {
  PGHOST = '127.0.0.1',
  PGPORT = '5432',
  PGDATABASE = 'crosspost',
  PGUSER = 'crosspost',
  PGPASSWORD = 'secure_password',
  PGSSLMODE, // установите 'require', если требуется SSL
} = process.env;

const pool = new Pool({
  host: PGHOST,
  port: Number(PGPORT),
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  ssl: PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Опционально: логирование для отладки (можно удалить в продакшене)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Database config:');
  console.log('  Host:', PGHOST);
  console.log('  Port:', PGPORT);
  console.log('  Database:', PGDATABASE);
  console.log('  User:', PGUSER);
  // Пароль не логируем по соображениям безопасности
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ DB query', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }
    return res;
  } catch (err) {
    console.error('❌ DB query error:', { text, error: err.message });
    throw err;
  }
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
