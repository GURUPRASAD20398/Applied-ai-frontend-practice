import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import { renderWithProviders, seedSession, settle } from '../test/utils';
import { orderService, paymentService, cartService, wishlistService } from '../services';

jest.mock('../services', () => ({
  paymentService: { pay: jest.fn() },
  orderService: { place: jest.fn() },
  cartService: { get: jest.fn() },
  wishlistService: { get: jest.fn() },
}));
jest.mock('../services/authService', () => require('../test/authServiceMock'));

const futureExpiry = () => `12/${String((new Date().getFullYear() + 3) % 100).padStart(2, '0')}`;

const renderPayment = (state = { addressId: 1, pointsToRedeem: 0 }) =>
  renderWithProviders(
    <Routes>
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/checkout" element={<p>Checkout page</p>} />
      <Route path="/order-success/:id" element={<p>Success page</p>} />
    </Routes>,
    { initialEntries: [{ pathname: '/payment', state }] }
  );

const fillCard = async ({ name = 'Asha Verma', number = '4242424242424242', expiry = futureExpiry(), cvv = '123' } = {}) => {
  await userEvent.type(screen.getByLabelText('Name on card'), name);
  await userEvent.type(screen.getByLabelText('Card number'), number);
  await userEvent.type(screen.getByLabelText(/Expiry/), expiry.replace('/', ''));
  await userEvent.type(screen.getByLabelText('CVV'), cvv);
};

beforeEach(() => {
  jest.clearAllMocks();
  seedSession();
  cartService.get.mockResolvedValue({ items: [], summary: { quantity: 1, subtotal: 300, tax: 15, total: 315 } });
  wishlistService.get.mockResolvedValue({ items: [] });
});

describe('PaymentPage', () => {
  test('redirects to checkout when no address was chosen', async () => {
    renderPayment(null);
    expect(screen.getByText('Checkout page')).toBeInTheDocument();
    await settle();
  });

  test('offers all five payment methods', async () => {
    renderPayment();
    ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'].forEach((m) => expect(screen.getByLabelText(m)).toBeInTheDocument());
    await settle();
  });

  test('validates card number (Luhn), expiry and CVV', async () => {
    renderPayment();
    await fillCard({ number: '4242424242424241', expiry: '01/20', cvv: '1' });
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));

    expect(await screen.findByText('Enter a valid card number')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid, unexpired date (MM/YY)')).toBeInTheDocument();
    expect(screen.getByText('CVV must be 3 or 4 digits')).toBeInTheDocument();
    expect(paymentService.pay).not.toHaveBeenCalled();
  });

  test('formats card number and expiry as the user types', async () => {
    renderPayment();
    await userEvent.type(screen.getByLabelText('Card number'), '4242424242424242');
    expect(screen.getByLabelText('Card number')).toHaveValue('4242 4242 4242 4242');
    await userEvent.type(screen.getByLabelText(/Expiry/), '1228');
    expect(screen.getByLabelText(/Expiry/)).toHaveValue('12/28');
  });

  test('pays by card, places the order and navigates to the success page', async () => {
    paymentService.pay.mockResolvedValue({ paymentId: 7 });
    orderService.place.mockResolvedValue({ order: { id: 42 } });
    renderPayment({ addressId: 3, pointsToRedeem: 50 });
    await fillCard();
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));

    expect(await screen.findByText('Success page')).toBeInTheDocument();
    expect(paymentService.pay).toHaveBeenCalledWith({
      method: 'credit_card',
      details: expect.objectContaining({ cardNumber: '4242 4242 4242 4242', cvv: '123' }),
      pointsToRedeem: 50,
    });
    expect(orderService.place).toHaveBeenCalledWith({ addressId: 3, paymentId: 7, pointsToRedeem: 50 });
  });

  test('shows the decline message and does not create an order', async () => {
    paymentService.pay.mockRejectedValue({ response: { status: 402, data: { error: 'Payment declined by the issuing bank. Please try another method.' } } });
    renderPayment();
    await fillCard({ number: '4000000000000002' });
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));

    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Payment declined');
    expect(orderService.place).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: /^Pay/ })).toBeEnabled());
  });

  test('disables the pay button while processing', async () => {
    let resolve;
    paymentService.pay.mockReturnValue(new Promise((r) => { resolve = r; }));
    orderService.place.mockResolvedValue({ order: { id: 1 } });
    renderPayment();
    await fillCard();
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(await screen.findByRole('button', { name: /Processing payment/ })).toBeDisabled();
    resolve({ paymentId: 1 });
    expect(await screen.findByText('Success page')).toBeInTheDocument();
  });

  test('validates UPI ID', async () => {
    renderPayment();
    await userEvent.click(screen.getByLabelText('UPI'));
    await userEvent.type(screen.getByLabelText('UPI ID'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(await screen.findByText('Enter a valid UPI ID (e.g. name@bank)')).toBeInTheDocument();

    paymentService.pay.mockResolvedValue({ paymentId: 2 });
    orderService.place.mockResolvedValue({ order: { id: 2 } });
    await userEvent.clear(screen.getByLabelText('UPI ID'));
    await userEvent.type(screen.getByLabelText('UPI ID'), 'asha@okbank');
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(await screen.findByText('Success page')).toBeInTheDocument();
    expect(paymentService.pay).toHaveBeenCalledWith(expect.objectContaining({ method: 'upi', details: { upiId: 'asha@okbank' } }));
  });

  test('requires a bank for net banking and a wallet for wallet payments', async () => {
    renderPayment();
    await userEvent.click(screen.getByLabelText('Net Banking'));
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(await screen.findByText('Select a bank')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Wallet'));
    await userEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(await screen.findByText('Select a wallet')).toBeInTheDocument();
  });
});
