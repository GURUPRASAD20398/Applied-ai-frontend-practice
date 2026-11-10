const router = require('express').Router();
const db = require('../db');

router.get('/', (_req, res) => {
  const books = db.books.all();
  const items = db.categories.all().map((c) => ({ ...c, bookCount: books.filter((b) => b.categoryId === c.id).length }));
  res.json({ items });
});

module.exports = router;
