const os = require('os');
const fs = require('fs');
const path = require('path');
const request = require('supertest');

/** Creates an isolated, freshly seeded app per test file. */
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ebookstore-'));
  process.env.NODE_ENV = 'test';
  process.env.DB_DIR = dir;
  process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
  const { seed } = require('../src/db/seed');
  seed();
  const { createApp } = require('../src/app');
  return createApp();
}

async function login(app, email = 'user@bookstore.com', password = 'User@1234', remember = false) {
  const res = await request(app).post('/api/auth/login').send({ email, password, remember });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { setup, login, auth, request };
