const { setup, login, auth, request } = require('./helpers');
const { luhn, validateExpiry, validatePaymentDetails } = require('../src/services/payment');

let app;
let token;
beforeAll(async () => {
  app = setup();
  token = await login(app);
});

const futureExpiry = () => `12/${String((new Date().getFullYear() + 3) % 100).padStart(2, '0')}`;
const goodCard = () => ({ cardNumber: '4242 4242 4242 4242', cvv: '123', expiry: futureExpiry(), cardName: 'Asha Verma' });

describe('payment validation helpers', () => {
  test('luhn', () => {
    expect(luhn('4242424242424242')).toBe(true);
    expect(luhn('4242424242424241')).toBe(false);
  });
  test('expiry', () => {
    expect(validateExpiry('01/20')).toBe(false);
    expect(validateExpiry('13/30')).toBe(false);
    expect(validateExpiry(futureExpiry())).toBe(true);
  });
  test('per-method rules', () => {
    expect(validatePaymentDetails('credit_card', {})).toEqual(
      expect.objectContaining({ cardNumber: expect.any(String), cvv: expect.any(String), expiry: expect.any(String) })
    );
    expect(validatePaymentDetails('upi', { upiId: 'bad' }).upiId).toBeDefined();
    expect(validatePaymentDetails('upi', { upiId: 'asha@okbank' })).toEqual({});
    expect(validatePaymentDetails('net_banking', { bank: 'Nope' }).bank).toBeDefined();
    expect(validatePaymentDetails('wallet', { wallet: 'PayWallet' })).toEqual({});
    expect(validatePaymentDetails('bitcoin', {}).method).toBeDefined();
  });
});

describe('Checkout -> Payment -> Order flow', () => {
  test('payment fails with empty cart', async () => {
    const res = await request(app).post('/api/payment').set(auth(token)).send({ method: 'credit_card', details: goodCard() });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cart is empty/i);
  });

  test('invalid card details are rejected without charging', async () => {
    await request(app).post('/api/cart').set(auth(token)).send({ bookId: 2, quantity: 1 });
    const res = await request(app)
      .post('/api/payment')
      .set(auth(token))
      .send({ method: 'credit_card', details: { ...goodCard(), cardNumber: '1234', cvv: '1' } });
    expect(res.status).toBe(400);
    expect(res.body.details.cardNumber).toBeDefined();
    expect(res.body.details.cvv).toBeDefined();
  });

  test('declined card returns 402', async () => {
    const res = await request(app)
      .post('/api/payment')
      .set(auth(token))
      .send({ method: 'credit_card', details: { ...goodCard(), cardNumber: '4000000000000002' } });
    expect(res.status).toBe(402);
  });

  test('full purchase with reward points redemption', async () => {
    const before = (await request(app).get('/api/auth/user').set(auth(token))).body.user.rewardPoints;
    const stockBefore = (await request(app).get('/api/books/2')).body.book.stock;

    const preview = await request(app).post('/api/orders/preview').set(auth(token)).send({ pointsToRedeem: 100 });
    expect(preview.body.pointsRedeemed).toBe(100);
    expect(preview.body.payable).toBeCloseTo(preview.body.total - 100, 2);

    const pay = await request(app)
      .post('/api/payment')
      .set(auth(token))
      .send({ method: 'credit_card', details: goodCard(), pointsToRedeem: 100 });
    expect(pay.status).toBe(201);
    expect(pay.body.amount).toBeCloseTo(preview.body.payable, 2);

    const addrs = await request(app).get('/api/address').set(auth(token));
    const order = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ addressId: addrs.body.items[0].id, paymentId: pay.body.paymentId, pointsToRedeem: 100 });
    expect(order.status).toBe(201);
    expect(order.body.order.orderNumber).toMatch(/^ORD-\d+$/);
    expect(order.body.order.total).toBeCloseTo(pay.body.amount, 2);
    expect(order.body.order.pointsRedeemed).toBe(100);

    // cart cleared, stock decremented, points updated
    expect((await request(app).get('/api/cart').set(auth(token))).body.items).toHaveLength(0);
    expect((await request(app).get('/api/books/2')).body.book.stock).toBe(stockBefore - 1);
    const after = (await request(app).get('/api/auth/user').set(auth(token))).body.user.rewardPoints;
    expect(after).toBe(before - 100 + order.body.pointsEarned);

    // a payment can only be used once
    const replay = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ addressId: addrs.body.items[0].id, paymentId: pay.body.paymentId });
    expect(replay.status).toBe(400);
  });

  test('cannot redeem more points than balance', async () => {
    await request(app).post('/api/cart').set(auth(token)).send({ bookId: 3 });
    const res = await request(app).post('/api/orders/preview').set(auth(token)).send({ pointsToRedeem: 999999 });
    expect(res.status).toBe(400);
    await request(app).delete('/api/cart').set(auth(token));
  });

  test('order cannot be created with unverified payment', async () => {
    await request(app).post('/api/cart').set(auth(token)).send({ bookId: 3 });
    const res = await request(app).post('/api/orders').set(auth(token)).send({ addressId: 1, paymentId: 9999 });
    expect(res.status).toBe(400);
    await request(app).delete('/api/cart').set(auth(token));
  });
});

describe('Orders, Buy Again & recommendations', () => {
  test('lists order history newest first', async () => {
    const res = await request(app).get('/api/orders').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(3);
    const dates = res.body.items.map((o) => o.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test('buy again rebuilds the cart from a previous order', async () => {
    const res = await request(app).post('/api/cart/rebuy/1').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.items.map((i) => i.bookId).sort()).toEqual([1, 9]);
    expect(res.body.items.find((i) => i.bookId === 9).quantity).toBe(2);
    await request(app).delete('/api/cart').set(auth(token));
  });

  test('cannot rebuy someone else\'s order', async () => {
    const admin = await login(app, 'admin@bookstore.com', 'Admin@123');
    expect((await request(app).post('/api/cart/rebuy/1').set(auth(admin))).status).toBe(404);
  });

  test('recommendations exclude owned books and favour purchased categories', async () => {
    const res = await request(app).get('/api/recommendations').set(auth(token));
    expect(res.body.basedOn).toBe('history');
    const ids = res.body.items.map((b) => b.id);
    [1, 9, 19, 25, 2].forEach((owned) => expect(ids).not.toContain(owned));
    expect(res.body.items).toHaveLength(8);
  });

  test('anonymous recommendations fall back to popular', async () => {
    const res = await request(app).get('/api/recommendations');
    expect(res.body.basedOn).toBe('popular');
  });
});

describe('Admin API', () => {
  test('customers are forbidden', async () => {
    expect((await request(app).get('/api/admin/stats').set(auth(token))).status).toBe(403);
  });

  test('stats and book CRUD', async () => {
    const admin = await login(app, 'admin@bookstore.com', 'Admin@123');
    const stats = await request(app).get('/api/admin/stats').set(auth(admin));
    expect(stats.body).toEqual(expect.objectContaining({ totalBooks: 48, totalUsers: 2 }));

    const payload = { title: 'New Title', author: 'A. Writer', publisher: 'Pub', categoryId: 1, price: 350, stock: 5 };
    const created = await request(app).post('/api/admin/books').set(auth(admin)).send(payload);
    expect(created.status).toBe(201);
    const id = created.body.book.id;

    const edited = await request(app).put(`/api/admin/books/${id}`).set(auth(admin)).send({ ...payload, price: 399 });
    expect(edited.body.book.price).toBe(399);

    expect((await request(app).post('/api/admin/books').set(auth(admin)).send({ ...payload, price: -5 })).status).toBe(400);
    expect((await request(app).delete(`/api/admin/books/${id}`).set(auth(admin))).status).toBe(200);
    expect((await request(app).get(`/api/books/${id}`)).status).toBe(404);
  });
});
