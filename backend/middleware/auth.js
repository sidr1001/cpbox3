const jwt = require('jsonwebtoken');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: payload.userId, email: payload.email };
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

