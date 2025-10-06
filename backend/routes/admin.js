const express = require('express');
const db = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// middleware to check superadmin
async function requireSuperAdmin(req, res, next) {
  try {
    const q = await db.query('SELECT role FROM user_roles WHERE user_id=$1 LIMIT 1', [req.user.userId]);
    const role = q.rows[0]?.role || 'user';
    if (role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Role check failed' });
  }
}

// GET /api/admin/users - list users with basic aggregates
router.get('/users', auth(), requireSuperAdmin, async (_req, res) => {
  try {
    const roles = await db.query('SELECT user_id, role FROM user_roles');
    const users = await Promise.all(roles.rows.map(async (r) => {
      const profile = await db.query('SELECT display_name FROM profiles WHERE user_id=$1 LIMIT 1', [r.user_id]).catch(() => ({ rows: [] }));
      const management = await db.query('SELECT is_active, work_hours_start, work_hours_end, service_rate FROM user_management WHERE user_id=$1 LIMIT 1', [r.user_id]).catch(() => ({ rows: [] }));
      const balance = await db.query('SELECT balance FROM user_balance WHERE user_id=$1 LIMIT 1', [r.user_id]).catch(() => ({ rows: [] }));
      return {
        id: r.user_id,
        email: `user-${String(r.user_id).slice(0,8)}@example.com`,
        display_name: profile.rows[0]?.display_name || 'Без имени',
        is_active: management.rows[0]?.is_active || false,
        balance: Number(balance.rows[0]?.balance || 0),
        role: r.role,
        work_hours_start: management.rows[0]?.work_hours_start || null,
        work_hours_end: management.rows[0]?.work_hours_end || null,
        service_rate: management.rows[0]?.service_rate || null,
      };
    }));
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// PATCH /api/admin/users/:id/status { is_active: boolean }
router.patch('/users/:id/status', auth(), requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body || {};
    await db.query(
      `INSERT INTO user_management (user_id, is_active, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (user_id) DO UPDATE SET is_active=EXCLUDED.is_active, updated_at=NOW()`,
      [userId, !!is_active]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PATCH /api/admin/users/:id/balance { balance: number }
router.patch('/users/:id/balance', auth(), requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { balance } = req.body || {};
    await db.query(
      `INSERT INTO user_balance (user_id, balance, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (user_id) DO UPDATE SET balance=EXCLUDED.balance, updated_at=NOW()`,
      [userId, Number(balance) || 0]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

module.exports = router;

