const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/vk/oauth/url - get VK OAuth authorization URL
router.get('/oauth/url', auth(), async (req, res) => {
  try {
    const clientId = process.env.VK_CLIENT_ID;
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings`;
    
    if (!clientId) {
      return res.status(500).json({ error: 'VK_CLIENT_ID not configured' });
    }

    const authUrl = `https://oauth.vk.com/authorize?client_id=${clientId}&display=page&redirect_uri=${encodeURIComponent(redirectUri)}&scope=groups,offline&response_type=token&v=5.131`;
    
    res.json({ auth_url: authUrl });
  } catch (e) {
    console.error('VK OAuth URL error:', e);
    res.status(500).json({ error: 'Failed to generate VK OAuth URL' });
  }
});

// GET /api/vk/oauth/callback - handle OAuth callback (optional, redirect to frontend)
router.get('/oauth/callback', (req, res) => {
  // VK uses implicit flow with hash fragment, redirect to frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/settings${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`);
});

module.exports = router;
