const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { notFound } = require('../utils/errors');

router.use(authenticate);

const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;
const text = (max) => (v) => v.length <= max;

const rules = {
  fullName: { test: (v) => v.length >= 2 && v.length <= 80, message: 'Full name must be 2-80 characters' },
  phone: { test: (v) => PHONE_RE.test(v), message: 'Enter a valid 10-digit mobile number' },
  houseNumber: { test: text(40), message: 'House number is too long' },
  street: { test: (v) => v.length >= 2 && v.length <= 120, message: 'Street is required' },
  city: { test: text(60), message: 'City is required' },
  state: { test: text(60), message: 'State is required' },
  country: { test: text(60), message: 'Country is required' },
  pincode: { test: (v) => PIN_RE.test(v), message: 'Enter a valid 6-digit pincode' },
};

const mine = (userId) => db.addresses.where((a) => a.userId === userId);

function ensureSingleDefault(userId, defaultId) {
  mine(userId).forEach((a) => {
    const should = a.id === defaultId;
    if (a.isDefault !== should) db.addresses.update(a.id, { isDefault: should });
  });
}

function owned(req) {
  const a = db.addresses.find(req.params.id);
  if (!a || a.userId !== req.user.id) throw notFound('Address not found');
  return a;
}

router.get('/', (req, res) => res.json({ items: mine(req.user.id) }));

router.post('/', (req, res) => {
  const data = validate(req.body, rules);
  const first = mine(req.user.id).length === 0;
  const created = db.addresses.insert({ ...data, userId: req.user.id, isDefault: false });
  if (first || req.body.isDefault === true) ensureSingleDefault(req.user.id, created.id);
  res.status(201).json({ items: mine(req.user.id) });
});

router.put('/:id', (req, res) => {
  const addr = owned(req);
  const data = validate(req.body, rules);
  db.addresses.update(addr.id, data);
  if (req.body.isDefault === true) ensureSingleDefault(req.user.id, addr.id);
  res.json({ items: mine(req.user.id) });
});

router.put('/:id/default', (req, res) => {
  const addr = owned(req);
  ensureSingleDefault(req.user.id, addr.id);
  res.json({ items: mine(req.user.id) });
});

router.delete('/:id', (req, res) => {
  const addr = owned(req);
  db.addresses.remove(addr.id);
  const rest = mine(req.user.id);
  if (addr.isDefault && rest.length) ensureSingleDefault(req.user.id, rest[0].id);
  res.json({ items: mine(req.user.id) });
});

module.exports = router;
