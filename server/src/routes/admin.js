const router = require('express').Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { notFound } = require('../utils/errors');

router.use(authenticate, requireAdmin);

const bookRules = {
  title: { test: (v) => v.length >= 1 && v.length <= 200, message: 'Title is required (max 200 chars)' },
  author: { test: (v) => v.length >= 1 && v.length <= 120, message: 'Author is required' },
  publisher: { test: (v) => v.length >= 1 && v.length <= 120, message: 'Publisher is required' },
  categoryId: { type: 'number', test: (v) => Number.isInteger(v) && !!db.categories.find(v), message: 'Select a valid category' },
  price: { type: 'number', test: (v) => v > 0 && v <= 100000, message: 'Price must be greater than 0' },
  stock: { type: 'number', test: (v) => Number.isInteger(v) && v >= 0 && v <= 100000, message: 'Stock must be 0 or more' },
  rating: { type: 'number', required: false, test: (v) => v >= 0 && v <= 5, message: 'Rating must be 0-5' },
  isbn: { required: false, test: (v) => v.length <= 20, message: 'ISBN too long' },
  description: { required: false, test: (v) => v.length <= 2000, message: 'Description too long' },
  deliveryDays: { type: 'number', required: false, test: (v) => Number.isInteger(v) && v >= 1 && v <= 30, message: 'Delivery days must be 1-30' },
};

router.get('/stats', (_req, res) => {
  const orders = db.orders.all();
  res.json({
    totalBooks: db.books.all().length,
    totalOrders: orders.length,
    totalUsers: db.users.all().length,
    revenue: orders.reduce((t, o) => t + o.total, 0),
  });
});

router.get('/books', (_req, res) => res.json({ items: db.books.all() }));

router.post('/books', (req, res) => {
  const data = validate(req.body, bookRules);
  const cat = db.categories.find(data.categoryId);
  const book = db.books.insert({
    rating: 0,
    isbn: '',
    description: '',
    deliveryDays: 4,
    ...data,
    category: cat.name,
    reviewCount: 0,
    image: '/covers/default.svg',
    publishedDate: new Date().toISOString().slice(0, 10),
    featured: false,
    bestseller: false,
  });
  res.status(201).json({ book });
});

router.put('/books/:id', (req, res) => {
  if (!db.books.find(req.params.id)) throw notFound('Book not found');
  const data = validate(req.body, bookRules);
  const cat = db.categories.find(data.categoryId);
  res.json({ book: db.books.update(req.params.id, { ...data, category: cat.name }) });
});

router.delete('/books/:id', (req, res) => {
  if (!db.books.remove(req.params.id)) throw notFound('Book not found');
  // Cascade: remove dangling cart/wishlist entries.
  const id = Number(req.params.id);
  db.cart.removeWhere((c) => c.bookId === id);
  db.wishlist.removeWhere((w) => w.bookId === id);
  res.json({ message: 'Book deleted' });
});

module.exports = router;
