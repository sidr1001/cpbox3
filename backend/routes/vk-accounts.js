const express = require('express');
const db = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure table vk_accounts(user_id uuid, vk_id text, name text, screen_name text, photo_url text, admin_level int, created_at, updated_at)

// GET /api/vk/accounts
router.get('/accounts', auth(), async (req, res) => {
  try {
    const rows = await db.query('SELECT vk_id, name, screen_name, photo_url, admin_level FROM vk_accounts WHERE user_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json({ accounts: rows.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load VK accounts' });
  }
});

// POST /api/vk/accounts - save array of accounts
router.post('/accounts', auth(), async (req, res) => {
  try {
    const accounts = Array.isArray(req.body?.accounts) ? req.body.accounts : [];
    const now = new Date().toISOString();
    for (const acc of accounts) {
      await db.query(
        `INSERT INTO vk_accounts (user_id, vk_id, name, screen_name, photo_url, admin_level, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
         ON CONFLICT (user_id, vk_id) DO UPDATE SET name=EXCLUDED.name, screen_name=EXCLUDED.screen_name, photo_url=EXCLUDED.photo_url, admin_level=EXCLUDED.admin_level, updated_at=$7`,
        [req.user.userId, String(acc.id), acc.name || `${acc.first_name} ${acc.last_name}`, acc.screen_name || '', acc.photo_100 || null, Number(acc.admin_level || 0), now]
      );
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save VK accounts' });
  }
});

// DELETE /api/vk/accounts/:vk_id
router.delete('/accounts/:vk_id', auth(), async (req, res) => {
  try {
    await db.query('DELETE FROM vk_accounts WHERE user_id=$1 AND vk_id=$2', [req.user.userId, req.params.vk_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete VK account' });
  }
});

module.exports = router;

