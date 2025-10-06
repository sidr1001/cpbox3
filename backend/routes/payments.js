const express = require('express');
const db = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/payments - last N transactions
router.get('/', auth(), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const rows = await db.query(
      'SELECT id, amount, status, payment_method, created_at FROM payment_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2',
      [req.user.userId, limit]
    );
    res.json({ transactions: rows.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// POST /api/payments - create transaction (demo)
router.post('/', auth(), async (req, res) => {
  try {
    const { amount, payment_method } = req.body || {};
    const row = await db.query(
      `INSERT INTO payment_transactions (user_id, amount, status, payment_method, created_at, updated_at)
       VALUES ($1,$2,'pending',$3,NOW(),NOW()) RETURNING id`,
      [req.user.userId, Number(amount) || 0, payment_method || 'card']
    );

    // Simulate completion instantly (demo)
    const id = row.rows[0].id;
    await db.query('UPDATE payment_transactions SET status=$1, updated_at=NOW() WHERE id=$2', ['completed', id]);
    await db.query(
      `INSERT INTO user_balance (user_id, balance, updated_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (user_id) DO UPDATE SET balance = user_balance.balance + EXCLUDED.balance, updated_at=NOW()`,
      [req.user.userId, Number(amount) || 0]
    );

    res.status(201).json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

module.exports = router;

