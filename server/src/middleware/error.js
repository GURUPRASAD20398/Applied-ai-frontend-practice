const { HttpError } = require('../utils/errors');
const logger = require('../utils/logger');

const notFoundHandler = (_req, _res, next) => next(new HttpError(404, 'Route not found'));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  // Detailed error stays server-side; clients get a generic message.
  logger.error('Unhandled error', { path: req.path, method: req.method, error: err.message });
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { notFoundHandler, errorHandler };
