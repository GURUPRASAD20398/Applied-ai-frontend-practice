const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { verifyPassword } = require('../utils/password');
const { validate } = require('../utils/validate');
const { badRequest, unauthorized } = require('../utils/errors');
const { authenticate, signToken, revokeToken, sanitizeUser } = require('../middleware/auth');
const config = require('../config');
const logger = require('../utils/logger');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = validate(req.body, {
    email: { test: (v) => EMAIL_RE.test(v) && v.length <= 254, message: 'Enter a valid email address' },
    password: { test: (v) => v.length >= 6 && v.length <= 128, message: 'Password must be at least 6 characters' },
  });
  const remember = req.body.remember === true;

  const user = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
  // Same message for unknown email and wrong password to avoid user enumeration.
  if (!user || !verifyPassword(password, user.password)) {
    logger.warn('Failed login attempt');
    throw unauthorized('Invalid email or password');
  }
  logger.info('User login successful', { user_id: user.id });
  res.json({ token: signToken(user, remember), user: sanitizeUser(user) });
});

router.get('/user', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticate, (req, res) => {
  revokeToken(req.tokenPayload);
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
