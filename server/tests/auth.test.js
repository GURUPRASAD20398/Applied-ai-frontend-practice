const { setup, login, auth, request } = require('./helpers');

let app;
beforeAll(() => {
  app = setup();
});

describe('Auth API', () => {
  test('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nope', password: 'User@1234' });
    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });

  test('rejects wrong password with generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'user@bookstore.com', password: 'wrong-pass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('unknown user gets same message as wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@bookstore.com', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  test('logs in and never returns the password hash', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'user@bookstore.com', password: 'User@1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.email).toBe('user@bookstore.com');
  });

  test('GET /auth/user requires a token', async () => {
    expect((await request(app).get('/api/auth/user')).status).toBe(401);
    const token = await login(app);
    const res = await request(app).get('/api/auth/user').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Asha Verma');
  });

  test('logout revokes the token', async () => {
    const token = await login(app);
    expect((await request(app).post('/api/auth/logout').set(auth(token))).status).toBe(200);
    expect((await request(app).get('/api/auth/user').set(auth(token))).status).toBe(401);
  });

  test('forged token is rejected', async () => {
    const res = await request(app).get('/api/auth/user').set(auth('abc.def.ghi'));
    expect(res.status).toBe(401);
  });
});
