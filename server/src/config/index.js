const path = require('path');
const crypto = require('crypto');

// Load server/.env when present (Node >= 20.12). Secrets never live in source.
const envFile = path.join(__dirname, '..', '..', '.env');
try {
  process.loadEnvFile(envFile);
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const isTest = process.env.NODE_ENV === 'test';

if (!process.env.JWT_SECRET && !isTest) {
  console.warn(
    JSON.stringify({
      level: 'WARN',
      msg: 'JWT_SECRET not set; using an ephemeral secret. Sessions reset on restart.',
    })
  );
}

const config = {
  isTest,
  port: Number(process.env.PORT) || 4000,
  // Never bind to all interfaces.
  host: process.env.HOST || '127.0.0.1',
  get dbDir() {
    return process.env.DB_DIR || path.join(__dirname, '..', '..', 'data');
  },
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sessionTtl: '2h',
  rememberMeTtl: '7d',
  taxRate: 0.05,
  pointValue: 1, // 1 reward point = 1 currency unit
  pointsEarnPer: 100, // earn 1 point per 100 spent
  currency: 'INR',
};

module.exports = config;
