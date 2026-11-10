const { setup, login, auth, request } = require('./helpers');

let app;
let token;
beforeAll(async () => {
  app = setup();
  token = await login(app);
});

const goodAddress = {
  fullName: 'Ravi Kumar',
  phone: '9123456780',
  houseNumber: '12',
  street: 'Brigade Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560025',
};

describe('Cart API', () => {
  test('requires authentication', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
  });

  test('add, update quantity, save for later, remove, clear', async () => {
    let res = await request(app).post('/api/cart').set(auth(token)).send({ bookId: 2, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.summary.quantity).toBe(2);
    const rowId = res.body.items[0].id;

    res = await request(app).post('/api/cart').set(auth(token)).send({ bookId: 2 });
    expect(res.body.items[0].quantity).toBe(3);

    res = await request(app).put(`/api/cart/${rowId}`).set(auth(token)).send({ quantity: 1 });
    expect(res.body.summary.quantity).toBe(1);
    expect(res.body.summary.tax).toBeCloseTo(res.body.summary.subtotal * 0.05, 2);

    res = await request(app).put(`/api/cart/${rowId}`).set(auth(token)).send({ savedForLater: true });
    expect(res.body.summary.quantity).toBe(0);

    res = await request(app).delete(`/api/cart/${rowId}`).set(auth(token));
    expect(res.body.items).toHaveLength(0);

    await request(app).post('/api/cart').set(auth(token)).send({ bookId: 3 });
    res = await request(app).delete('/api/cart').set(auth(token));
    expect(res.body.items).toHaveLength(0);
  });

  test('rejects invalid quantity and out-of-stock books', async () => {
    expect((await request(app).post('/api/cart').set(auth(token)).send({ bookId: 2, quantity: 99 })).status).toBe(400);
    expect((await request(app).post('/api/cart').set(auth(token)).send({ bookId: 11 })).status).toBe(400); // id 11 has stock 0
    expect((await request(app).post('/api/cart').set(auth(token)).send({ bookId: 9999 })).status).toBe(404);
  });
});

describe('Wishlist API', () => {
  test('add, de-duplicate, move to cart, remove', async () => {
    await request(app).post('/api/wishlist').set(auth(token)).send({ bookId: 5 });
    let res = await request(app).post('/api/wishlist').set(auth(token)).send({ bookId: 5 });
    expect(res.body.items).toHaveLength(1);

    res = await request(app).post('/api/wishlist/5/move-to-cart').set(auth(token));
    expect(res.body.items).toHaveLength(0);
    const cart = await request(app).get('/api/cart').set(auth(token));
    expect(cart.body.items.some((i) => i.bookId === 5)).toBe(true);

    await request(app).post('/api/wishlist').set(auth(token)).send({ bookId: 6 });
    res = await request(app).delete('/api/wishlist/6').set(auth(token));
    expect(res.body.items).toHaveLength(0);
    await request(app).delete('/api/cart').set(auth(token));
  });
});

describe('Address API', () => {
  test('validates fields', async () => {
    const res = await request(app).post('/api/address').set(auth(token)).send({ ...goodAddress, phone: '123', pincode: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.details.phone).toBeDefined();
    expect(res.body.details.pincode).toBeDefined();
  });

  test('add, edit, set default, delete', async () => {
    let res = await request(app).post('/api/address').set(auth(token)).send(goodAddress);
    expect(res.status).toBe(201);
    const added = res.body.items.find((a) => a.fullName === 'Ravi Kumar');

    res = await request(app).put(`/api/address/${added.id}`).set(auth(token)).send({ ...goodAddress, city: 'Mysuru' });
    expect(res.body.items.find((a) => a.id === added.id).city).toBe('Mysuru');

    res = await request(app).put(`/api/address/${added.id}/default`).set(auth(token));
    expect(res.body.items.filter((a) => a.isDefault)).toHaveLength(1);
    expect(res.body.items.find((a) => a.isDefault).id).toBe(added.id);

    res = await request(app).delete(`/api/address/${added.id}`).set(auth(token));
    expect(res.body.items.find((a) => a.id === added.id)).toBeUndefined();
    expect(res.body.items.filter((a) => a.isDefault)).toHaveLength(1);
  });

  test("cannot touch another user's address", async () => {
    const admin = await login(app, 'admin@bookstore.com', 'Admin@123');
    const res = await request(app).delete('/api/address/1').set(auth(admin));
    expect(res.status).toBe(404);
  });
});
