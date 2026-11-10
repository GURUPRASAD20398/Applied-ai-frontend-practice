const fs = require('fs');
const path = require('path');
const config = require('../config');

const filePath = (name) => path.join(config.dbDir, `${name}.json`);

function read(name) {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function write(name, data) {
  const target = filePath(name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target); // atomic replace
}

/**
 * Tiny table abstraction over a JSON file. Mirrors a SQL table with an
 * auto-increment integer primary key so a PostgreSQL migration is mechanical.
 */
function table(name) {
  return {
    all: () => read(name),
    find: (id) => read(name).find((r) => r.id === Number(id)) || null,
    where: (predicate) => read(name).filter(predicate),
    findOne: (predicate) => read(name).find(predicate) || null,
    insert(record) {
      const rows = read(name);
      const id = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      const row = { id, ...record };
      rows.push(row);
      write(name, rows);
      return row;
    },
    update(id, patch) {
      const rows = read(name);
      const idx = rows.findIndex((r) => r.id === Number(id));
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch, id: rows[idx].id };
      write(name, rows);
      return rows[idx];
    },
    remove(id) {
      const rows = read(name);
      const next = rows.filter((r) => r.id !== Number(id));
      write(name, next);
      return next.length !== rows.length;
    },
    removeWhere(predicate) {
      const rows = read(name);
      const next = rows.filter((r) => !predicate(r));
      write(name, next);
      return rows.length - next.length;
    },
    replaceAll: (rows) => write(name, rows),
  };
}

module.exports = {
  users: table('users'),
  books: table('books'),
  categories: table('categories'),
  orders: table('orders'),
  addresses: table('addresses'),
  cart: table('cart'),
  wishlist: table('wishlist'),
  payments: table('payments'),
  rewardPoints: table('rewardPoints'),
  views: table('views'),
};
