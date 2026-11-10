const crypto = require('crypto');

const KEY_LEN = 64;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, KEY_LEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(plain, salt, KEY_LEN);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
