const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/vk/me - get VK user info using access token
router.get('/me', auth(), async (req, res) => {
  try {
    const vkToken = req.query.vk_token;
    
    if (!vkToken) {
      return res.status(400).json({ error: 'vk_token parameter is required' });
    }

    // Call VK API to get user info
    const response = await fetch(`https://api.vk.com/method/users.get?access_token=${vkToken}&v=5.131`);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.error_msg || 'VK API error' });
    }

    res.json(data);
  } catch (e) {
    console.error('VK API error:', e);
    res.status(500).json({ error: 'Failed to get VK user info' });
  }
});

module.exports = router;
