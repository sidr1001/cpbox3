const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user posts
router.get('/', auth(), async (req, res) => {
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
router.post('/', auth(), [
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
router.post('/:id/publish', auth(), async (req, res) => {
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

    // Update post status
    await db.query(
      'UPDATE posts SET status = $1, published_at = $2 WHERE id = $3',
      ['published', new Date().toISOString(), id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
