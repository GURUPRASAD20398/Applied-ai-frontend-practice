const { setup, request } = require('./helpers');

let app;
beforeAll(() => {
  app = setup();
});

describe('Books API', () => {
  test('lists books with pagination metadata', async () => {
    const res = await request(app).get('/api/books?limit=10&page=2');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(10);
    expect(res.body.page).toBe(2);
    expect(res.body.total).toBe(48);
    expect(res.body.totalPages).toBe(5);
  });

  test('search is case-insensitive and matches title/author', async () => {
    const res = await request(app).get('/api/books/search?q=EMBER');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((b) =>
      expect(`${b.title} ${b.author} ${b.publisher} ${b.category} ${b.isbn}`.toLowerCase()).toContain('ember')
    );
  });

  test('filters by category, price range and rating', async () => {
    const res = await request(app).get('/api/books?category=Fantasy&minPrice=200&maxPrice=700&rating=3.5&limit=48');
    expect(res.status).toBe(200);
    res.body.items.forEach((b) => {
      expect(b.category).toBe('Fantasy');
      expect(b.price).toBeGreaterThanOrEqual(200);
      expect(b.price).toBeLessThanOrEqual(700);
      expect(b.rating).toBeGreaterThanOrEqual(3.5);
    });
  });

  test('sorts by price ascending and descending', async () => {
    const asc = (await request(app).get('/api/books?sort=price_asc&limit=48')).body.items.map((b) => b.price);
    const desc = (await request(app).get('/api/books?sort=price_desc&limit=48')).body.items.map((b) => b.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  test('GET /books/category/:category', async () => {
    const res = await request(app).get('/api/books/category/fiction');
    expect(res.status).toBe(200);
    expect(res.body.items.every((b) => b.category === 'Fiction')).toBe(true);
  });

  test('book details include related and frequently-bought-together', async () => {
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body.book.id).toBe(1);
    expect(res.body.book.expectedDelivery).toBeDefined();
    expect(res.body.related.length).toBeGreaterThan(0);
    expect(res.body.frequentlyBoughtTogether.length).toBeGreaterThan(0);
  });

  test('unknown book returns 404', async () => {
    expect((await request(app).get('/api/books/99999')).status).toBe(404);
  });
});
