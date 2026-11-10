const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { recommendForUser, similarBooks } = require('../services/recommendation');
const { withDelivery } = require('./books');

router.get('/', optionalAuth, (req, res) => {
  const { books, basedOn } = recommendForUser(req.user ? req.user.id : null, 8);
  res.json({ items: books.map(withDelivery), basedOn });
});

router.get('/similar/:bookId', (req, res) => {
  res.json({ items: similarBooks(Number(req.params.bookId), 6).map(withDelivery) });
});

// Re-exported for symmetry; kept here to make auth requirement explicit.
router.get('/me', authenticate, (req, res) => {
  const { books } = recommendForUser(req.user.id, 8);
  res.json({ items: books.map(withDelivery) });
});

module.exports = router;
