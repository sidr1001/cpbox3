const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { requestLogger, errorLogger } = require('./middleware/logger');
const { metricsMiddleware, metricsRoute } = require('./middleware/metrics');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const postsRoutes = require('./routes/posts');
const vkOAuthRoutes = require('./routes/vk-oauth');
const vkRoutes = require('./routes/vk');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');
const vkAccountsRoutes = require('./routes/vk-accounts');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(metricsMiddleware);

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));
app.get('/metrics', metricsRoute);

// Static uploads
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir, { maxAge: '365d', immutable: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/vk', vkOAuthRoutes);
app.use('/api/vk', vkRoutes);
app.use('/api/vk', vkAccountsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);

app.use(errorLogger);

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

