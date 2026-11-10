import { loginSchema, addressSchema, paymentSchema, luhnValid, expiryValid } from './validators';
import { formatPrice } from './format';

const future = () => `12/${String((new Date().getFullYear() + 2) % 100).padStart(2, '0')}`;

describe('validators', () => {
  test('luhn', () => {
    expect(luhnValid('4242424242424242')).toBe(true);
    expect(luhnValid('4242424242424243')).toBe(false);
  });

  test('expiry', () => {
    expect(expiryValid('01/19')).toBe(false);
    expect(expiryValid('00/30')).toBe(false);
    expect(expiryValid('1230')).toBe(false);
    expect(expiryValid(future())).toBe(true);
  });

  test('login schema', async () => {
    await expect(loginSchema.validate({ email: 'a@b.co', password: 'secret1' })).resolves.toBeTruthy();
    await expect(loginSchema.validate({ email: 'bad', password: 'secret1' })).rejects.toThrow('valid email');
    await expect(loginSchema.validate({ email: 'a@b.co', password: '123' })).rejects.toThrow('at least 6');
  });

  test('address schema', async () => {
    const ok = { fullName: 'Ravi', phone: '9123456780', houseNumber: '1', street: 'Road', city: 'C', state: 'S', country: 'India', pincode: '560001' };
    await expect(addressSchema.validate(ok)).resolves.toBeTruthy();
    await expect(addressSchema.validate({ ...ok, phone: '1234567890' })).rejects.toThrow('10-digit');
    await expect(addressSchema.validate({ ...ok, pincode: '56' })).rejects.toThrow('6-digit');
  });

  test('payment schema per method', async () => {
    const card = { method: 'credit_card', cardName: 'A', cardNumber: '4242 4242 4242 4242', expiry: future(), cvv: '123' };
    await expect(paymentSchema('credit_card').validate(card)).resolves.toBeTruthy();
    await expect(paymentSchema('debit_card').validate({ ...card, cvv: 'ab' })).rejects.toThrow('CVV');
    await expect(paymentSchema('upi').validate({ method: 'upi', upiId: 'ab@bank' })).resolves.toBeTruthy();
    await expect(paymentSchema('net_banking').validate({ method: 'net_banking' })).rejects.toThrow('bank');
    await expect(paymentSchema('wallet').validate({ method: 'wallet', wallet: 'PayWallet' })).resolves.toBeTruthy();
  });

  test('formatPrice uses INR', () => {
    expect(formatPrice(1234.5)).toContain('1,234.50');
  });
});
