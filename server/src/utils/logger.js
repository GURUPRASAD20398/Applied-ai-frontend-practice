const log = (level, msg, extra = {}) => {
  if (process.env.NODE_ENV === 'test') return;
  // Structured JSON logging. Callers must never pass secrets or PII.
  console[level === 'ERROR' ? 'error' : 'log'](
    JSON.stringify({ level, msg, time: new Date().toISOString(), ...extra })
  );
};

module.exports = {
  info: (msg, extra) => log('INFO', msg, extra),
  warn: (msg, extra) => log('WARN', msg, extra),
  error: (msg, extra) => log('ERROR', msg, extra),
};
