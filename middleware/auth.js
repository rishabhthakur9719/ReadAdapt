const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const extractedToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
