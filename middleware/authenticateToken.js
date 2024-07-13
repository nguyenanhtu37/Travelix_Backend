const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = crypto.randomBytes(32).toString('hex');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
};

const checkUserRole = (requiredRole) => (req, res, next) => {
  if (req.user && req.user.role === requiredRole) {
    next();
  } else {
    res.sendStatus(403); // Forbidden
  }
};

module.exports = { authenticateToken, checkUserRole };
