const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate, positiveInt } = require('../utils/validate');
const { badRequest, notFound } = require('../utils/errors');

router.use(authenticate);

const MAX_QTY = 10;
const list = (userId) =>
  db.wishlist
    .where((w) => w.userId === userId)
    .map((w) => ({ ...w, book: db.books.find(w.bookId) }))
    .filter((w) => w.book);

router.get('/', (req, res) => res.json({ items: list(req.user.id) }));

router.post('/', (req, res) => {
  const { bookId } = validate(req.body, {
    bookId: { type: 'number', test: positiveInt, message: 'Valid bookId is required' },
  });
  if (!db.books.find(bookId)) throw notFound('Book not found');
  if (!db.wishlist.findOne((w) => w.userId === req.user.id && w.bookId === bookId)) {
    db.wishlist.insert({ userId: req.user.id, bookId, addedAt: new Date().toISOString() });
  }
  res.status(201).json({ items: list(req.user.id) });
});

router.delete('/:bookId', (req, res) => {
  db.wishlist.removeWhere((w) => w.userId === req.user.id && w.bookId === Number(req.params.bookId));
  res.json({ items: list(req.user.id) });
});

router.post('/:bookId/move-to-cart', (req, res) => {
  const bookId = Number(req.params.bookId);
  const entry = db.wishlist.findOne((w) => w.userId === req.user.id && w.bookId === bookId);
  if (!entry) throw notFound('Wishlist item not found');
  const book = db.books.find(bookId);
  if (!book || book.stock < 1) throw badRequest('This book is out of stock');
  const existing = db.cart.findOne((c) => c.userId === req.user.id && c.bookId === bookId);
  if (existing) db.cart.update(existing.id, { quantity: Math.min(existing.quantity + 1, MAX_QTY, book.stock), savedForLater: false });
  else db.cart.insert({ userId: req.user.id, bookId, quantity: 1, savedForLater: false });
  db.wishlist.remove(entry.id);
  res.json({ items: list(req.user.id) });
});

module.exports = router;
