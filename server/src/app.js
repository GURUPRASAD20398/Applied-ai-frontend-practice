const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { notFoundHandler, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/books', require('./routes/books'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/wishlist', require('./routes/wishlist'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/address', require('./routes/address'));
  app.use('/api/payment', require('./routes/payment'));
  app.use('/api/recommendations', require('./routes/recommendations'));
  app.use('/api/admin', require('./routes/admin'));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
