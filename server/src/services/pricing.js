const db = require('../db');
const config = require('../config');
const { badRequest } = require('../utils/errors');

const round2 = (n) => Math.round(n * 100) / 100;

function expectedDelivery(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Cart rows joined with their book. Rows whose book was deleted are dropped. */
function getCartItems(userId) {
  return db.cart
    .where((c) => c.userId === userId)
    .map((c) => ({ ...c, book: db.books.find(c.bookId) }))
    .filter((c) => c.book);
}

function summarize(items) {
  const active = items.filter((i) => !i.savedForLater);
  const quantity = active.reduce((t, i) => t + i.quantity, 0);
  const subtotal = round2(active.reduce((t, i) => t + i.book.price * i.quantity, 0));
  const tax = round2(subtotal * config.taxRate);
  return { quantity, subtotal, tax, total: round2(subtotal + tax) };
}

/**
 * Server-side source of truth for checkout totals. Never trust client amounts.
 */
function computeCheckout(user, pointsToRedeem = 0) {
  const items = getCartItems(user.id).filter((i) => !i.savedForLater);
  if (!items.length) throw badRequest('Your cart is empty');
  const base = summarize(items);

  const requested = Math.floor(Number(pointsToRedeem) || 0);
  if (requested < 0) throw badRequest('Invalid reward points');
  const fresh = db.users.find(user.id);
  if (requested > fresh.rewardPoints) throw badRequest('Not enough reward points');
  const maxByTotal = Math.floor(base.total / config.pointValue);
  const pointsRedeemed = Math.min(requested, maxByTotal);
  const discount = round2(pointsRedeemed * config.pointValue);

  return {
    items,
    ...base,
    pointsRedeemed,
    discount,
    payable: round2(base.total - discount),
    pointsBalance: fresh.rewardPoints,
    pointsToEarn: Math.floor(round2(base.total - discount) / config.pointsEarnPer),
  };
}

module.exports = { getCartItems, summarize, computeCheckout, expectedDelivery, round2 };
