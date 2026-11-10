const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate, positiveInt } = require('../utils/validate');
const { badRequest, notFound } = require('../utils/errors');
const { computeCheckout, expectedDelivery } = require('../services/pricing');
const config = require('../config');
const logger = require('../utils/logger');

router.use(authenticate);

const strip = ({ items, ...rest }) => ({
  ...rest,
  items: items.map((i) => ({ bookId: i.bookId, title: i.book.title, price: i.book.price, quantity: i.quantity, image: i.book.image })),
});

router.get('/', (req, res) => {
  const items = db.orders
    .where((o) => o.userId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ items });
});

// Totals preview for checkout (reward-points redemption).
router.post('/preview', (req, res) => {
  res.json(strip(computeCheckout(req.user, req.body.pointsToRedeem)));
});

router.get('/:id', (req, res) => {
  const order = db.orders.find(req.params.id);
  if (!order || order.userId !== req.user.id) throw notFound('Order not found');
  res.json({ order });
});

router.post('/', (req, res) => {
  const { addressId, paymentId } = validate(req.body, {
    addressId: { type: 'number', test: positiveInt, message: 'Select a delivery address' },
    paymentId: { type: 'number', test: positiveInt, message: 'Payment is required' },
  });

  const address = db.addresses.find(addressId);
  if (!address || address.userId !== req.user.id) throw badRequest('Invalid delivery address');

  const payment = db.payments.find(paymentId);
  if (!payment || payment.userId !== req.user.id || payment.status !== 'success') {
    throw badRequest('Payment not verified');
  }
  if (payment.used) throw badRequest('Payment already used');

  const checkout = computeCheckout(req.user, req.body.pointsToRedeem);
  if (checkout.payable !== payment.amount) throw badRequest('Cart changed after payment. Please retry checkout.');

  // Re-verify stock at commit time.
  checkout.items.forEach((i) => {
    if (i.book.stock < i.quantity) throw badRequest(`"${i.book.title}" is no longer available in the requested quantity`);
  });

  checkout.items.forEach((i) => db.books.update(i.book.id, { stock: i.book.stock - i.quantity }));
  db.payments.update(payment.id, { used: true });

  const order = db.orders.insert({
    userId: req.user.id,
    items: checkout.items.map((i) => ({
      bookId: i.book.id,
      title: i.book.title,
      author: i.book.author,
      image: i.book.image,
      price: i.book.price,
      quantity: i.quantity,
    })),
    subtotal: checkout.subtotal,
    tax: checkout.tax,
    pointsRedeemed: checkout.pointsRedeemed,
    discount: checkout.discount,
    total: checkout.payable,
    status: 'Confirmed',
    paymentMethod: payment.method,
    transactionId: payment.transactionId,
    address,
    estimatedDelivery: expectedDelivery(Math.max(...checkout.items.map((i) => i.book.deliveryDays))),
    createdAt: new Date().toISOString(),
  });
  const withNumber = db.orders.update(order.id, { orderNumber: `ORD-${100000 + order.id}` });

  // Reward points ledger: redemption (negative) and earnings (positive).
  const user = db.users.find(req.user.id);
  let balance = user.rewardPoints;
  const now = new Date().toISOString();
  if (checkout.pointsRedeemed > 0) {
    balance -= checkout.pointsRedeemed;
    db.rewardPoints.insert({ userId: user.id, points: -checkout.pointsRedeemed, type: 'redeem', description: `Redeemed on ${withNumber.orderNumber}`, createdAt: now });
  }
  if (checkout.pointsToEarn > 0) {
    balance += checkout.pointsToEarn;
    db.rewardPoints.insert({ userId: user.id, points: checkout.pointsToEarn, type: 'earn', description: `Earned on ${withNumber.orderNumber}`, createdAt: now });
  }
  db.users.update(user.id, { rewardPoints: balance });

  // Remove purchased items; keep "saved for later" ones.
  db.cart.removeWhere((c) => c.userId === req.user.id && !c.savedForLater);
  logger.info('Order placed', { user_id: user.id, order_id: order.id });

  res.status(201).json({ order: withNumber, pointsBalance: balance, pointsEarned: checkout.pointsToEarn, currency: config.currency });
});

module.exports = router;
