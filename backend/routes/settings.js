const express = require('express');
const db = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user settings
router.get('/', auth(), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      // Create default settings if they don't exist
      await db.query(
        'INSERT INTO user_settings (user_id) VALUES ($1)',
        [req.user.userId]
      );
      
      const newSettings = await db.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [req.user.userId]
      );
      
      return res.json(newSettings.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/', auth(), async (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(key => key !== 'user_id' && key !== 'id');
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [req.user.userId, ...fields.map(field => req.body[field])];

    const result = await db.query(
      `UPDATE user_settings SET ${setClause} WHERE user_id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
