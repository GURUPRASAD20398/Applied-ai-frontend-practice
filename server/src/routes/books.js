const router = require('express').Router();
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { notFound, badRequest } = require('../utils/errors');
const { expectedDelivery } = require('../services/pricing');
const { similarBooks, frequentlyBoughtTogether } = require('../services/recommendation');

const withDelivery = (b) => ({
  ...b,
  inStock: b.stock > 0,
  expectedDelivery: expectedDelivery(b.deliveryDays),
});

const norm = (s) => String(s || '').toLowerCase();
const num = (v) => (v === undefined || v === '' ? undefined : Number(v));

function queryBooks(q) {
  const search = norm(q.search || q.q).trim();
  const minPrice = num(q.minPrice);
  const maxPrice = num(q.maxPrice);
  const minRating = num(q.rating || q.minRating);
  const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);
  const categories = list(q.category).map(norm);
  const authors = list(q.author).map(norm);
  const publishers = list(q.publisher).map(norm);

  let books = db.books.all().filter((b) => {
    if (search && ![b.title, b.author, b.publisher, b.category, b.isbn].some((f) => norm(f).includes(search))) return false;
    if (categories.length && !categories.includes(norm(b.category)) && !categories.includes(String(b.categoryId))) {
      const cat = db.categories.findOne((c) => c.id === b.categoryId);
      if (!cat || !categories.includes(norm(cat.slug))) return false;
    }
    if (authors.length && !authors.includes(norm(b.author))) return false;
    if (publishers.length && !publishers.includes(norm(b.publisher))) return false;
    if (minRating !== undefined && b.rating < minRating) return false;
    if (minPrice !== undefined && b.price < minPrice) return false;
    if (maxPrice !== undefined && b.price > maxPrice) return false;
    if (q.featured === 'true' && !b.featured) return false;
    if (q.bestseller === 'true' && !b.bestseller) return false;
    return true;
  });

  const sorters = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    newest: (a, b) => b.publishedDate.localeCompare(a.publishedDate),
  };
  if (sorters[q.sort]) books = books.sort(sorters[q.sort]);
  return books;
}

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const all = queryBooks(req.query);
  const total = all.length;
  const items = all.slice((page - 1) * limit, page * limit).map(withDelivery);
  res.json({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length > 100) throw badRequest('Search query too long');
  const items = queryBooks({ search: q }).slice(0, 10).map(withDelivery);
  res.json({ items, total: items.length });
});

router.get('/facets', (_req, res) => {
  const books = db.books.all();
  const uniq = (key) => [...new Set(books.map((b) => b[key]))].sort();
  res.json({
    categories: db.categories.all(),
    authors: uniq('author'),
    publishers: uniq('publisher'),
    priceRange: { min: Math.min(...books.map((b) => b.price)), max: Math.max(...books.map((b) => b.price)) },
  });
});

router.get('/category/:category', (req, res) => {
  const items = queryBooks({ category: req.params.category }).map(withDelivery);
  res.json({ items, total: items.length });
});

router.get('/:id', optionalAuth, (req, res) => {
  const book = db.books.find(req.params.id);
  if (!book) throw notFound('Book not found');
  if (req.user) {
    // Record the view (used by the recommendation engine); one row per user/book.
    const seen = db.views.findOne((v) => v.userId === req.user.id && v.bookId === book.id);
    if (!seen) db.views.insert({ userId: req.user.id, bookId: book.id, viewedAt: new Date().toISOString() });
  }
  res.json({
    book: withDelivery(book),
    related: similarBooks(book.id, 6).map(withDelivery),
    frequentlyBoughtTogether: frequentlyBoughtTogether(book.id, 3).map(withDelivery),
  });
});

module.exports = router;
module.exports.withDelivery = withDelivery;
