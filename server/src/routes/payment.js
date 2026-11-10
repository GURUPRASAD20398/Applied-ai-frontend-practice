const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { badRequest } = require('../utils/errors');
const { computeCheckout } = require('../services/pricing');
const { validatePaymentDetails, processPayment } = require('../services/payment');
const config = require('../config');
const logger = require('../utils/logger');

const payLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment attempts. Please try again later.' },
});

router.use(authenticate);

// Mock payment. The charged amount is always computed server-side from the cart.
router.post('/', payLimiter, (req, res) => {
  const { method } = validate(req.body, { method: { message: 'Payment method is required' } });
  const details = req.body.details && typeof req.body.details === 'object' ? req.body.details : {};
  const errors = validatePaymentDetails(method, details);
  if (Object.keys(errors).length) throw badRequest('Invalid payment details', errors);

  const checkout = computeCheckout(req.user, req.body.pointsToRedeem);
  const payment = processPayment(req.user, { method, details, amount: checkout.payable });
  logger.info('Payment processed', { user_id: req.user.id, status: payment.status });

  if (payment.status === 'failed') {
    return res.status(402).json({ error: 'Payment declined by the issuing bank. Please try another method.' });
  }
  return res.status(201).json({
    paymentId: payment.id,
    transactionId: payment.transactionId,
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
  });
});

module.exports = router;
