const db = require('../db');

const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank'];
const WALLETS = ['PayWallet', 'QuickPay', 'MobiCash'];
const METHODS = ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'];

// Test card that the mock gateway always declines.
const DECLINE_CARD = '4000000000000002';

function luhn(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function validateExpiry(expiry) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry || '');
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  const now = new Date();
  // Valid through the last day of the expiry month.
  return new Date(year, month, 0, 23, 59, 59) >= now;
}

/** Returns an errors object (empty when valid). Used by both API and tests. */
function validatePaymentDetails(method, details = {}) {
  const errors = {};
  if (!METHODS.includes(method)) {
    errors.method = 'Unsupported payment method';
    return errors;
  }
  if (method === 'credit_card' || method === 'debit_card') {
    const number = String(details.cardNumber || '').replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(number) || !luhn(number)) errors.cardNumber = 'Invalid card number';
    if (!/^\d{3,4}$/.test(String(details.cvv || ''))) errors.cvv = 'Invalid CVV';
    if (!validateExpiry(details.expiry)) errors.expiry = 'Invalid or expired date (MM/YY)';
    if (!String(details.cardName || '').trim()) errors.cardName = 'Name on card is required';
  }
  if (method === 'upi' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(String(details.upiId || ''))) {
    errors.upiId = 'Invalid UPI ID (e.g. name@bank)';
  }
  if (method === 'net_banking' && !BANKS.includes(details.bank)) errors.bank = 'Select a bank';
  if (method === 'wallet' && !WALLETS.includes(details.wallet)) errors.wallet = 'Select a wallet';
  return errors;
}

/** Mock gateway: approves everything except the designated decline card. */
function processPayment(user, { method, details, amount }) {
  const number = String(details.cardNumber || '').replace(/[\s-]/g, '');
  const declined = number === DECLINE_CARD;
  const record = db.payments.insert({
    userId: user.id,
    method,
    amount,
    // Only non-sensitive reference data is stored; never PAN/CVV.
    reference: method.includes('card') ? `**** ${number.slice(-4)}` : details.upiId || details.bank || details.wallet,
    status: declined ? 'failed' : 'success',
    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
    used: false,
    createdAt: new Date().toISOString(),
  });
  return record;
}

module.exports = { validatePaymentDetails, processPayment, luhn, validateExpiry, BANKS, WALLETS, METHODS };
