const { badRequest } = require('./errors');

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Minimal allowlist validator. `rules` maps field -> (value) => error string | null.
 * Returns the sanitised object containing only the allowlisted fields.
 */
function validate(body, rules) {
  const errors = {};
  const clean = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const { required = true, type = 'string', test, message } = rule;
    let value = body ? body[field] : undefined;
    if (type === 'string') value = str(value);
    const empty = value === '' || value === undefined || value === null;
    if (empty) {
      if (required) errors[field] = message || `${field} is required`;
      return;
    }
    if (type === 'number') {
      value = Number(value);
      if (!Number.isFinite(value)) {
        errors[field] = `${field} must be a number`;
        return;
      }
    }
    if (type === 'boolean') value = value === true || value === 'true';
    if (test && !test(value)) {
      errors[field] = message || `${field} is invalid`;
      return;
    }
    clean[field] = value;
  });
  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);
  return clean;
}

const positiveInt = (v) => Number.isInteger(v) && v > 0;

module.exports = { validate, positiveInt };
