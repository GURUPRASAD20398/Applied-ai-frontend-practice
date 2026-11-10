const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate, positiveInt } = require('../utils/validate');
const { badRequest, notFound } = require('../utils/errors');
const { getCartItems, summarize } = require('../services/pricing');

router.use(authenticate);

const MAX_QTY = 10;

const view = (userId) => {
  const items = getCartItems(userId);
  return { items, summary: summarize(items) };
};

router.get('/', (req, res) => res.json(view(req.user.id)));

router.post('/', (req, res) => {
  const { bookId, quantity } = validate(req.body, {
    bookId: { type: 'number', test: positiveInt, message: 'Valid bookId is required' },
    quantity: { type: 'number', required: false, test: (v) => positiveInt(v) && v <= MAX_QTY, message: `Quantity must be 1-${MAX_QTY}` },
  });
  const qty = quantity || 1;
  const book = db.books.find(bookId);
  if (!book) throw notFound('Book not found');
  if (book.stock < 1) throw badRequest('This book is out of stock');

  const existing = db.cart.findOne((c) => c.userId === req.user.id && c.bookId === bookId);
  if (existing) {
    const next = Math.min(existing.quantity + qty, MAX_QTY, book.stock);
    db.cart.update(existing.id, { quantity: next, savedForLater: false });
  } else {
    db.cart.insert({ userId: req.user.id, bookId, quantity: Math.min(qty, book.stock), savedForLater: false });
  }
  res.status(201).json(view(req.user.id));
});

// Re-creates the cart from a previous order ("Buy Again"). Must be declared before /:id routes.
router.post('/rebuy/:orderId', (req, res) => {
  const order = db.orders.find(req.params.orderId);
  if (!order || order.userId !== req.user.id) throw notFound('Order not found');
  db.cart.removeWhere((c) => c.userId === req.user.id);
  const skipped = [];
  order.items.forEach((item) => {
    const book = db.books.find(item.bookId);
    if (!book || book.stock < 1) {
      skipped.push(item.title);
      return;
    }
    db.cart.insert({
      userId: req.user.id,
      bookId: book.id,
      quantity: Math.min(item.quantity, book.stock, MAX_QTY),
      savedForLater: false,
    });
  });
  res.json({ ...view(req.user.id), skipped });
});

router.put('/:id', (req, res) => {
  const row = db.cart.find(req.params.id);
  if (!row || row.userId !== req.user.id) throw notFound('Cart item not found');
  const patch = {};
  if (req.body.quantity !== undefined) {
    const q = Number(req.body.quantity);
    const book = db.books.find(row.bookId);
    if (!positiveInt(q) || q > MAX_QTY) throw badRequest(`Quantity must be 1-${MAX_QTY}`);
    if (book && q > book.stock) throw badRequest(`Only ${book.stock} in stock`);
    patch.quantity = q;
  }
  if (req.body.savedForLater !== undefined) patch.savedForLater = req.body.savedForLater === true;
  db.cart.update(row.id, patch);
  res.json(view(req.user.id));
});

router.delete('/', (req, res) => {
  db.cart.removeWhere((c) => c.userId === req.user.id);
  res.json(view(req.user.id));
});

router.delete('/:id', (req, res) => {
  const row = db.cart.find(req.params.id);
  if (!row || row.userId !== req.user.id) throw notFound('Cart item not found');
  db.cart.remove(row.id);
  res.json(view(req.user.id));
});

module.exports = router;
