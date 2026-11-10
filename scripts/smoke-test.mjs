/* Live end-to-end smoke test. Usage:
 *   node scripts/smoke-test.mjs [baseUrl]
 * baseUrl defaults to SMOKE_BASE_URL or http://127.0.0.1:5174 (frontend origin, so the proxy is exercised).
 * Demo credentials can be overridden with SMOKE_USER_EMAIL / SMOKE_USER_PASSWORD / SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD.
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5174').replace(/\/$/, '');
const creds = {
  user: [process.env.SMOKE_USER_EMAIL || 'user@bookstore.com', process.env.SMOKE_USER_PASSWORD || 'User@1234'],
  admin: [process.env.SMOKE_ADMIN_EMAIL || 'admin@bookstore.com', process.env.SMOKE_ADMIN_PASSWORD || 'Admin@123'],
};

const results = [];
let token = '';

async function call(method, path, body, tok = token) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, data };
}

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

const expiry = () => `12/${String((new Date().getFullYear() + 3) % 100).padStart(2, '0')}`;

async function main() {
  console.log(`Smoke test against ${base}\n`);

  await step('frontend serves the SPA shell', async () => {
    const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    expect(res.status === 200 && html.includes('id="root"'), `status ${res.status}`);
  });

  await step('health endpoint', async () => {
    const r = await call('GET', '/health');
    expect(r.status === 200 && r.data.status === 'ok', `status ${r.status}`);
  });

  await step('login rejects bad credentials', async () => {
    const r = await call('POST', '/auth/login', { email: creds.user[0], password: 'definitely-wrong' });
    expect(r.status === 401, `expected 401, got ${r.status}`);
  });

  await step('login (customer)', async () => {
    const r = await call('POST', '/auth/login', { email: creds.user[0], password: creds.user[1], remember: true });
    expect(r.status === 200 && r.data.token, `status ${r.status}`);
    expect(!('password' in r.data.user), 'password hash leaked');
    token = r.data.token;
  });

  await step('current user', async () => {
    const r = await call('GET', '/auth/user');
    expect(r.status === 200 && r.data.user.email === creds.user[0], `status ${r.status}`);
  });

  let book;
  await step('browse + filter + sort + paginate', async () => {
    const r = await call('GET', '/books?category=Fantasy&sort=price_asc&limit=5&page=1');
    expect(r.status === 200 && r.data.items.length > 0, 'no fantasy books');
    const prices = r.data.items.map((b) => b.price);
    expect(prices.join() === [...prices].sort((a, b) => a - b).join(), 'not sorted ascending');
    book = r.data.items.find((b) => b.stock > 0);
    expect(book, 'no in-stock book found');
  });

  await step('instant search', async () => {
    const r = await call('GET', `/books/search?q=${encodeURIComponent(book.title.slice(0, 5))}`);
    expect(r.status === 200 && r.data.items.some((b) => b.id === book.id), 'book not found by search');
  });

  await step('book details with related + frequently bought together', async () => {
    const r = await call('GET', `/books/${book.id}`);
    expect(r.status === 200 && r.data.related.length > 0 && r.data.frequentlyBoughtTogether.length > 0, `status ${r.status}`);
  });

  await step('wishlist add -> move to cart', async () => {
    expect((await call('POST', '/wishlist', { bookId: book.id })).status === 201, 'add failed');
    const r = await call('POST', `/wishlist/${book.id}/move-to-cart`);
    expect(r.status === 200 && r.data.items.length === 0, `status ${r.status}`);
  });

  await step('cart: add, update quantity, totals', async () => {
    await call('DELETE', '/cart');
    expect((await call('POST', '/cart', { bookId: book.id, quantity: 1 })).status === 201, 'add failed');
    const r = await call('PUT', `/cart/${(await call('GET', '/cart')).data.items[0].id}`, { quantity: 2 });
    expect(r.data.summary.quantity === 2, 'quantity not updated');
    const expected = Math.round(book.price * 2 * 1.05 * 100) / 100;
    expect(Math.abs(r.data.summary.total - expected) < 0.01, `total ${r.data.summary.total} != ${expected}`);
  });

  await step('recommendations', async () => {
    const r = await call('GET', '/recommendations');
    expect(r.status === 200 && r.data.items.length > 0, 'no recommendations');
  });

  let addressId;
  await step('address: add + default', async () => {
    const r = await call('POST', '/address', {
      fullName: 'Smoke Tester', phone: '9123456780', houseNumber: '7', street: 'Test Street',
      city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411001', isDefault: true,
    });
    expect(r.status === 201, `status ${r.status}`);
    const added = r.data.items.find((a) => a.fullName === 'Smoke Tester');
    addressId = added.id;
    expect(r.data.items.filter((a) => a.isDefault).length === 1 && added.isDefault, 'default not exclusive');
  });

  await step('address validation', async () => {
    const r = await call('POST', '/address', { fullName: 'x', phone: '1', pincode: 'z' });
    expect(r.status === 400 && r.data.details.phone, `status ${r.status}`);
  });

  await step('checkout preview with reward points', async () => {
    const r = await call('POST', '/orders/preview', { pointsToRedeem: 50 });
    expect(r.status === 200 && r.data.pointsRedeemed === 50, `status ${r.status}`);
  });

  await step('payment: invalid card rejected, declined card 402', async () => {
    const bad = await call('POST', '/payment', { method: 'credit_card', details: { cardNumber: '1234', cvv: '1', expiry: '01/20', cardName: 'A' } });
    expect(bad.status === 400, `invalid card status ${bad.status}`);
    const declined = await call('POST', '/payment', { method: 'credit_card', details: { cardNumber: '4000000000000002', cvv: '123', expiry: expiry(), cardName: 'A' } });
    expect(declined.status === 402, `declined status ${declined.status}`);
  });

  let order;
  let pointsBefore;
  await step('payment + order placement (UPI) with points', async () => {
    pointsBefore = (await call('GET', '/auth/user')).data.user.rewardPoints;
    const pay = await call('POST', '/payment', { method: 'upi', details: { upiId: 'smoke@okbank' }, pointsToRedeem: 50 });
    expect(pay.status === 201, `payment status ${pay.status}`);
    const r = await call('POST', '/orders', { addressId, paymentId: pay.data.paymentId, pointsToRedeem: 50 });
    expect(r.status === 201 && /^ORD-\d+$/.test(r.data.order.orderNumber), `order status ${r.status}`);
    expect(Math.abs(r.data.order.total - pay.data.amount) < 0.01, 'charged amount != order total');
    order = r.data.order;
    const replay = await call('POST', '/orders', { addressId, paymentId: pay.data.paymentId });
    expect(replay.status === 400, 'payment reuse was allowed');
  });

  await step('post-order state: cart cleared, points updated', async () => {
    expect((await call('GET', '/cart')).data.items.length === 0, 'cart not cleared');
    const after = (await call('GET', '/auth/user')).data.user.rewardPoints;
    expect(after !== pointsBefore, 'reward points unchanged');
  });

  await step('order history + details', async () => {
    const list = await call('GET', '/orders');
    expect(list.data.items[0].id === order.id, 'new order not first');
    const d = await call('GET', `/orders/${order.id}`);
    expect(d.status === 200 && d.data.order.address.id === addressId, 'details/address mismatch');
  });

  await step('buy again rebuilds the cart', async () => {
    const r = await call('POST', `/cart/rebuy/${order.id}`);
    expect(r.status === 200 && r.data.items.some((i) => i.bookId === book.id && i.quantity >= 1), 'cart not rebuilt');
    await call('DELETE', '/cart');
  });

  await step('cleanup test address', async () => {
    expect((await call('DELETE', `/address/${addressId}`)).status === 200, 'delete failed');
  });

  await step('customer cannot access admin API', async () => {
    expect((await call('GET', '/admin/stats')).status === 403, 'expected 403');
  });

  await step('admin: stats + book CRUD', async () => {
    const login = await call('POST', '/auth/login', { email: creds.admin[0], password: creds.admin[1] }, '');
    expect(login.status === 200, `admin login ${login.status}`);
    const t = login.data.token;
    const stats = await call('GET', '/admin/stats', null, t);
    expect(stats.status === 200 && stats.data.totalBooks > 0 && stats.data.totalUsers > 0, 'bad stats');
    const payload = { title: 'Smoke Book', author: 'S. Tester', publisher: 'Smoke Press', categoryId: 1, price: 123, stock: 3 };
    const created = await call('POST', '/admin/books', payload, t);
    expect(created.status === 201, `create ${created.status}`);
    const id = created.data.book.id;
    expect((await call('PUT', `/admin/books/${id}`, { ...payload, price: 150 }, t)).data.book.price === 150, 'update failed');
    expect((await call('DELETE', `/admin/books/${id}`, null, t)).status === 200, 'delete failed');
  });

  await step('logout revokes the token', async () => {
    expect((await call('POST', '/auth/logout')).status === 200, 'logout failed');
    expect((await call('GET', '/auth/user')).status === 401, 'token still valid after logout');
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(`Smoke test crashed: ${e.message}`);
  process.exit(2);
});
