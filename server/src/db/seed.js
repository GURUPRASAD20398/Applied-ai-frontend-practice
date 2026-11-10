/* Generates the JSON "database" in /data and SVG book covers in /client/public/covers.
 * Run with: npm run seed -w server
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { hashPassword } = require('../utils/password');

const categories = [
  { id: 1, name: 'Fiction', slug: 'fiction', color: '#2563EB' },
  { id: 2, name: 'Non-Fiction', slug: 'non-fiction', color: '#0F766E' },
  { id: 3, name: 'Science & Technology', slug: 'science-technology', color: '#7C3AED' },
  { id: 4, name: 'Business', slug: 'business', color: '#B45309' },
  { id: 5, name: 'Self-Help', slug: 'self-help', color: '#BE185D' },
  { id: 6, name: "Children's", slug: 'childrens', color: '#059669' },
  { id: 7, name: 'History', slug: 'history', color: '#9A3412' },
  { id: 8, name: 'Fantasy', slug: 'fantasy', color: '#4338CA' },
];

// [title, author] pairs per category id (all titles/authors are fictional demo data)
const catalog = {
  1: [
    ['The Lantern Keeper', 'Maya Ellison'],
    ['Midnight on Harbor Street', 'Daniel Okoro'],
    ['A Quiet Orchard', 'Priya Raman'],
    ['The Cartographer\u2019s Daughter', 'Helena Voss'],
    ['Paper Cities', 'Tomas Reyes'],
    ['Salt and Ember', 'Maya Ellison'],
  ],
  2: [
    ['Walking the Long Way Home', 'Arjun Mehta'],
    ['The Last Fisherman', 'Clara Dunmore'],
    ['Letters from the Highlands', 'Ewan Sinclair'],
    ['Kitchens of the World', 'Sofia Marchetti'],
    ['Small Wonders', 'Arjun Mehta'],
    ['The Quiet Mountain', 'Clara Dunmore'],
  ],
  3: [
    ['Foundations of Machine Learning', 'Dr. Lena Fischer'],
    ['Clean Systems Design', 'Rohan Kapoor'],
    ['Cosmos in a Nutshell', 'Dr. Amir Haddad'],
    ['Practical Cloud Native', 'Rohan Kapoor'],
    ['The Data Pipeline Handbook', 'Naomi Chen'],
    ['Quantum Ideas for Everyone', 'Dr. Lena Fischer'],
  ],
  4: [
    ['The Startup Compass', 'Victoria Hale'],
    ['Lean Leadership', 'Marcus Webb'],
    ['Pricing Psychology', 'Victoria Hale'],
    ['Zero to Scale', 'Anita Desai'],
    ['The Negotiator\u2019s Desk', 'Marcus Webb'],
    ['Money Moves', 'Anita Desai'],
  ],
  5: [
    ['Atomic Mornings', 'Jordan Blake'],
    ['The Focus Habit', 'Sana Qureshi'],
    ['Slow Down to Speed Up', 'Jordan Blake'],
    ['Mindful Minutes', 'Sana Qureshi'],
    ['Confidence by Design', 'Leo Marston'],
    ['The Calm Reset', 'Leo Marston'],
  ],
  6: [
    ['Pip and the Paper Boat', 'Nora Whitfield'],
    ['The Sleepy Dragon', 'Ben Alvarez'],
    ['Zoe Counts the Stars', 'Nora Whitfield'],
    ['The Great Pancake Day', 'Ben Alvarez'],
    ['Little Fox Finds a Friend', 'Ines Carvalho'],
    ['Rainy Day Robots', 'Ines Carvalho'],
  ],
  7: [
    ['Empires of the Silk Road', 'Prof. Harold Whitman'],
    ['The Forgotten Republic', 'Dr. Iris Novak'],
    ['Voices of the Industrial Age', 'Prof. Harold Whitman'],
    ['Maps That Changed the World', 'Dr. Iris Novak'],
    ['Rivers and Rulers', 'Kavita Rao'],
    ['The Long Winter of 1816', 'Kavita Rao'],
  ],
  8: [
    ['The Ember Crown', 'Aria Thornwood'],
    ['Shadows of Eldermoor', 'Callum Drake'],
    ['The Glass Dragon', 'Aria Thornwood'],
    ['Kingdoms of Ash', 'Callum Drake'],
    ['The Moonlit Archive', 'Selene Park'],
    ['Wardens of the Wyrmwood', 'Selene Park'],
  ],
};

const publishers = ['Northwind Press', 'Bluebird Books', 'Meridian House', 'Oakleaf Publishing', 'Harborlight Media'];

const descriptions = {
  1: 'A beautifully written story of family, memory and second chances that will stay with you long after the final page.',
  2: 'An engaging and thoughtful narrative drawn from real experiences, told with warmth, humour and honesty.',
  3: 'A clear, practical and up-to-date guide that turns complex ideas into skills you can apply immediately.',
  4: 'Actionable frameworks and real-world case studies to help you build, lead and grow with confidence.',
  5: 'Simple, science-backed routines to help you build lasting habits and live with more focus and calm.',
  6: 'A delightfully illustrated tale that sparks curiosity and makes bedtime reading something to look forward to.',
  7: 'A richly researched account that brings the people, places and turning points of the past vividly to life.',
  8: 'An epic adventure of magic, loyalty and courage in a world you will not want to leave.',
};

// Deterministic pseudo-random so seeds are reproducible.
let s = 42;
const rand = () => {
  s = (s * 1664525 + 1013904223) % 4294967296;
  return s / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const escapeXml = (str) =>
  str.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

function wrapTitle(title, max = 16) {
  const words = title.split(' ');
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur = `${cur} ${w}`;
  });
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function coverSvg(book, color) {
  const lines = wrapTitle(book.title);
  const tspans = lines
    .map((l, i) => `<tspan x="150" dy="${i === 0 ? 0 : 34}">${escapeXml(l)}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" role="img" aria-label="${escapeXml(book.title)} cover">
<rect width="300" height="450" fill="${color}"/>
<rect x="18" y="18" width="264" height="414" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2"/>
<rect x="0" y="0" width="16" height="450" fill="#000000" fill-opacity="0.2"/>
<text x="150" y="150" font-family="Georgia, serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">${tspans}</text>
<line x1="90" y1="350" x2="210" y2="350" stroke="#F59E0B" stroke-width="3"/>
<text x="150" y="385" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">${escapeXml(book.author)}</text>
</svg>`;
}

function buildBooks() {
  const books = [];
  let id = 1;
  Object.entries(catalog).forEach(([catId, items]) => {
    const cat = categories.find((c) => c.id === Number(catId));
    items.forEach(([title, author], idx) => {
      const month = 1 + Math.floor(rand() * 12);
      const year = 2022 + Math.floor(rand() * 4);
      const day = 1 + Math.floor(rand() * 27);
      books.push({
        id,
        title,
        author,
        category: cat.name,
        categoryId: cat.id,
        publisher: pick(publishers),
        price: 199 + Math.floor(rand() * 80) * 10,
        rating: Math.round((3.4 + rand() * 1.6) * 10) / 10,
        reviewCount: 20 + Math.floor(rand() * 1800),
        stock: id % 11 === 0 ? 0 : 5 + Math.floor(rand() * 60),
        image: `/covers/${id}.svg`,
        isbn: `978-1-${String(10000 + id * 37).slice(0, 5)}-${String(100 + id).slice(-3)}-${id % 10}`,
        description: `${descriptions[cat.id]} ${title} by ${author} is a standout in ${cat.name}.`,
        deliveryDays: 2 + Math.floor(rand() * 5),
        publishedDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        featured: idx === 0 || id % 7 === 0,
        bestseller: idx === 1 || id % 5 === 0,
      });
      id += 1;
    });
  });
  return books;
}

function write(name, data) {
  fs.mkdirSync(config.dbDir, { recursive: true });
  fs.writeFileSync(path.join(config.dbDir, `${name}.json`), JSON.stringify(data, null, 2));
}

function seed() {
  const books = buildBooks();

  const coversDir = path.join(__dirname, '..', '..', '..', 'client', 'public', 'covers');
  fs.mkdirSync(coversDir, { recursive: true });
  books.forEach((b) => {
    const color = categories.find((c) => c.id === b.categoryId).color;
    fs.writeFileSync(path.join(coversDir, `${b.id}.svg`), coverSvg(b, color));
  });
  fs.writeFileSync(
    path.join(coversDir, 'default.svg'),
    coverSvg({ title: 'New Book', author: 'Unknown Author' }, '#1E293B')
  );

  const users = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@bookstore.com',
      password: hashPassword('Admin@123'),
      role: 'admin',
      rewardPoints: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Asha Verma',
      email: 'user@bookstore.com',
      password: hashPassword('User@1234'),
      role: 'customer',
      rewardPoints: 500,
      createdAt: '2024-02-10T00:00:00.000Z',
    },
  ];

  const addresses = [
    {
      id: 1,
      userId: 2,
      fullName: 'Asha Verma',
      phone: '9876543210',
      houseNumber: '42B',
      street: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560001',
      isDefault: true,
    },
  ];

  const taxRate = config.taxRate;
  const mkOrder = (id, date, lines, status) => {
    const items = lines.map(([bookId, quantity]) => {
      const b = books.find((x) => x.id === bookId);
      return { bookId, title: b.title, author: b.author, image: b.image, price: b.price, quantity };
    });
    const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    return {
      id,
      orderNumber: `ORD-${100000 + id}`,
      userId: 2,
      items,
      subtotal,
      tax,
      pointsRedeemed: 0,
      discount: 0,
      total: subtotal + tax,
      status,
      paymentMethod: 'credit_card',
      address: addresses[0],
      createdAt: date,
    };
  };
  const orders = [
    mkOrder(1, '2025-01-12T10:30:00.000Z', [[1, 1], [9, 2]], 'Delivered'),
    mkOrder(2, '2025-03-02T15:10:00.000Z', [[19, 1], [25, 1]], 'Delivered'),
  ];

  write('categories', categories);
  write('books', books);
  write('users', users);
  write('addresses', addresses);
  write('orders', orders);
  write('cart', []);
  write('wishlist', []);
  write('payments', []);
  write('rewardPoints', [
    { id: 1, userId: 2, points: 500, type: 'bonus', description: 'Welcome bonus', createdAt: '2024-02-10T00:00:00.000Z' },
  ]);
  write('views', []);
  return { books: books.length, users: users.length };
}

if (require.main === module) {
  const result = seed();
  console.log(JSON.stringify({ level: 'INFO', msg: 'Seed complete', ...result }));
}

module.exports = { seed };
