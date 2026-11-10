const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const db = require('../db');
const { unauthorized, forbidden } = require('../utils/errors');

// In-memory revocation list for logged-out tokens (jti). Replace with Redis in production.
const revoked = new Map();

function purgeRevoked() {
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of revoked) if (exp < now) revoked.delete(jti);
}

function signToken(user, remember) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: remember ? config.rememberMeTtl : config.sessionTtl,
    jwtid: crypto.randomUUID(),
    algorithm: 'HS256',
  });
}

function revokeToken(payload) {
  purgeRevoked();
  revoked.set(payload.jti, payload.exp);
}

function decode(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (revoked.has(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

const sanitizeUser = ({ password, ...rest }) => rest;

function authenticate(req, _res, next) {
  const payload = decode(req);
  if (!payload) return next(unauthorized());
  const user = db.users.find(payload.sub);
  if (!user) return next(unauthorized());
  req.user = sanitizeUser(user);
  req.tokenPayload = payload;
  return next();
}

/** Attaches req.user when a valid token is present but never rejects. */
function optionalAuth(req, _res, next) {
  const payload = decode(req);
  if (payload) {
    const user = db.users.find(payload.sub);
    if (user) req.user = sanitizeUser(user);
  }
  next();
}

const requireAdmin = (req, _res, next) =>
  req.user && req.user.role === 'admin' ? next() : next(forbidden('Admin access required'));

module.exports = { authenticate, optionalAuth, requireAdmin, signToken, revokeToken, sanitizeUser };
