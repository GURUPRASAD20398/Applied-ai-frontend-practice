const fs = require('fs');
const path = require('path');
const config = require('./config');
const { createApp } = require('./app');
const { seed } = require('./db/seed');
const logger = require('./utils/logger');

// First run: generate the JSON database.
if (!fs.existsSync(path.join(config.dbDir, 'books.json'))) {
  seed();
  logger.info('Database seeded');
}

createApp().listen(config.port, config.host, () => {
  logger.info('API listening', { host: config.host, port: config.port });
});
