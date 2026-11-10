import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().trim().required('Email is required').email('Enter a valid email address'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  remember: yup.boolean(),
});

export const addressSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required').min(2, 'Enter at least 2 characters'),
  phone: yup
    .string()
    .trim()
    .required('Phone is required')
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  houseNumber: yup.string().trim().required('House number is required'),
  street: yup.string().trim().required('Street is required').min(2, 'Enter at least 2 characters'),
  city: yup.string().trim().required('City is required'),
  state: yup.string().trim().required('State is required'),
  country: yup.string().trim().required('Country is required'),
  pincode: yup
    .string()
    .trim()
    .required('Pincode is required')
    .matches(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  isDefault: yup.boolean(),
});

export function luhnValid(num) {
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

export function expiryValid(value) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value || '');
  if (!m) return false;
  return new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59) >= new Date();
}

const cardShape = {
  cardName: yup.string().trim().required('Name on card is required'),
  cardNumber: yup
    .string()
    .required('Card number is required')
    .test('card', 'Enter a valid card number', (v) => {
      const digits = (v || '').replace(/[\s-]/g, '');
      return /^\d{13,19}$/.test(digits) && luhnValid(digits);
    }),
  expiry: yup
    .string()
    .required('Expiry is required')
    .test('expiry', 'Enter a valid, unexpired date (MM/YY)', expiryValid),
  cvv: yup
    .string()
    .required('CVV is required')
    .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
};

/** Builds the Yup schema for the selected payment method. */
export function paymentSchema(method) {
  const base = { method: yup.string().required() };
  if (method === 'credit_card' || method === 'debit_card') return yup.object({ ...base, ...cardShape });
  if (method === 'upi') {
    return yup.object({
      ...base,
      upiId: yup
        .string()
        .trim()
        .required('UPI ID is required')
        .matches(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, 'Enter a valid UPI ID (e.g. name@bank)'),
    });
  }
  if (method === 'net_banking') return yup.object({ ...base, bank: yup.string().required('Select a bank') });
  return yup.object({ ...base, wallet: yup.string().required('Select a wallet') });
}

export const bookSchema = yup.object({
  title: yup.string().trim().required('Title is required'),
  author: yup.string().trim().required('Author is required'),
  publisher: yup.string().trim().required('Publisher is required'),
  categoryId: yup.number().typeError('Select a category').required('Select a category'),
  price: yup.number().typeError('Enter a price').positive('Price must be greater than 0').required(),
  stock: yup.number().typeError('Enter stock').integer().min(0, 'Stock cannot be negative').required(),
  isbn: yup.string().trim(),
  description: yup.string().trim(),
});
