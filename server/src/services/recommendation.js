const db = require('../db');

const publicBook = (b) => b;

/** Score books for a user from purchase history + viewed books (category affinity). */
function recommendForUser(userId, limit = 8) {
  const books = db.books.all();
  const owned = new Set();
  const weights = {};
  const bump = (cat, w) => {
    weights[cat] = (weights[cat] || 0) + w;
  };

  if (userId) {
    db.orders.where((o) => o.userId === userId).forEach((o) =>
      o.items.forEach((i) => {
        owned.add(i.bookId);
        const b = books.find((x) => x.id === i.bookId);
        if (b) bump(b.categoryId, 3);
      })
    );
    db.views.where((v) => v.userId === userId).forEach((v) => {
      const b = books.find((x) => x.id === v.bookId);
      if (b) bump(b.categoryId, 1);
    });
  }

  const candidates = books.filter((b) => b.stock > 0 && !owned.has(b.id));
  const hasSignal = Object.keys(weights).length > 0;
  const scored = candidates
    .map((b) => ({ b, score: (weights[b.categoryId] || 0) * 10 + b.rating }))
    .sort((a, c) => c.score - a.score || c.b.reviewCount - a.b.reviewCount);

  return {
    basedOn: hasSignal ? 'history' : 'popular',
    books: scored.slice(0, limit).map((s) => publicBook(s.b)),
  };
}

function similarBooks(bookId, limit = 6) {
  const book = db.books.find(bookId);
  if (!book) return [];
  return db.books
    .where((b) => b.id !== book.id)
    .map((b) => ({
      b,
      score: (b.categoryId === book.categoryId ? 10 : 0) + (b.author === book.author ? 5 : 0) + b.rating,
    }))
    .sort((a, c) => c.score - a.score)
    .slice(0, limit)
    .map((s) => s.b);
}

/** Books most often purchased in the same order, topped up with similar books. */
function frequentlyBoughtTogether(bookId, limit = 3) {
  const counts = {};
  db.orders.all().forEach((o) => {
    if (o.items.some((i) => i.bookId === bookId)) {
      o.items.forEach((i) => {
        if (i.bookId !== bookId) counts[i.bookId] = (counts[i.bookId] || 0) + 1;
      });
    }
  });
  const ids = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id));
  const result = ids.map((id) => db.books.find(id)).filter(Boolean);
  if (result.length < limit) {
    similarBooks(bookId, limit + 3).forEach((b) => {
      if (result.length < limit && !result.some((r) => r.id === b.id)) result.push(b);
    });
  }
  return result.slice(0, limit);
}

module.exports = { recommendForUser, similarBooks, frequentlyBoughtTogether };
