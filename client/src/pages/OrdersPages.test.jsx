import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import OrderHistoryPage from './OrderHistoryPage';
import OrderSuccessPage from './OrderSuccessPage';
import { renderWithProviders, seedSession } from '../test/utils';
import { orderService, cartService, wishlistService } from '../services';
import { buildReceipt } from '../utils/receipt';

jest.mock('../services', () => ({
  orderService: { list: jest.fn(), details: jest.fn() },
  cartService: { get: jest.fn(), rebuy: jest.fn() },
  wishlistService: { get: jest.fn() },
}));
jest.mock('../services/authService', () => require('../test/authServiceMock'));

const address = { fullName: 'Asha Verma', phone: '9876543210', houseNumber: '42B', street: 'MG Road', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560001' };
const order = (id, over = {}) => ({
  id, orderNumber: `ORD-${100000 + id}`, createdAt: '2025-03-02T15:10:00.000Z', status: 'Delivered', total: 630, subtotal: 600, tax: 30,
  discount: 0, pointsRedeemed: 0, paymentMethod: 'credit_card', address,
  items: [{ bookId: 1, title: 'Alpha Book', price: 300, quantity: 2, image: '/c.svg' }], ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  seedSession();
  cartService.get.mockResolvedValue({ items: [], summary: { quantity: 0, subtotal: 0, tax: 0, total: 0 } });
  wishlistService.get.mockResolvedValue({ items: [] });
});

describe('OrderHistoryPage', () => {
  const renderHistory = () =>
    renderWithProviders(
      <Routes>
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/cart" element={<p>Cart page</p>} />
      </Routes>,
      { route: '/orders' }
    );

  test('lists previous orders with id, date, items, amount and status', async () => {
    orderService.list.mockResolvedValue({ items: [order(2), order(1, { status: 'Confirmed', total: 100 })] });
    renderHistory();
    const first = await screen.findByRole('article', { name: 'Order ORD-100002' });
    expect(within(first).getByText('Alpha Book')).toBeInTheDocument();
    expect(within(first).getByText(/630\.00/)).toBeInTheDocument();
    expect(within(first).getByText('Delivered')).toBeInTheDocument();
    expect(within(first).getByText(/2 Mar 2025/)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Order ORD-100001' })).toHaveTextContent('Confirmed');
    expect(within(first).getByRole('link', { name: 'View details' })).toHaveAttribute('href', '/orders/2');
  });

  test('Buy again recreates the cart and redirects to the cart page', async () => {
    orderService.list.mockResolvedValue({ items: [order(2)] });
    cartService.rebuy.mockResolvedValue({ items: [], summary: { quantity: 2, subtotal: 600, tax: 30, total: 630 }, skipped: [] });
    renderHistory();
    await userEvent.click(await screen.findByRole('button', { name: 'Buy again' }));
    expect(cartService.rebuy).toHaveBeenCalledWith(2);
    expect(await screen.findByText('Cart page')).toBeInTheDocument();
  });

  test('reports an error when Buy again fails and stays on the page', async () => {
    orderService.list.mockResolvedValue({ items: [order(2)] });
    cartService.rebuy.mockRejectedValue({ response: { data: { error: 'Order not found' } } });
    renderHistory();
    await userEvent.click(await screen.findByRole('button', { name: 'Buy again' }));
    expect(await screen.findByText('Order not found')).toBeInTheDocument();
    expect(screen.queryByText('Cart page')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buy again' })).toBeEnabled());
  });

  test('shows an empty state', async () => {
    orderService.list.mockResolvedValue({ items: [] });
    renderHistory();
    expect(await screen.findByText(/haven't placed any orders/)).toBeInTheDocument();
  });

  test('shows an error when orders cannot be loaded', async () => {
    orderService.list.mockRejectedValue(new Error('x'));
    renderHistory();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load your orders');
  });
});

describe('OrderSuccessPage', () => {
  const renderSuccess = (fresh = true) =>
    renderWithProviders(
      <Routes><Route path="/order-success/:id" element={<OrderSuccessPage />} /></Routes>,
      { initialEntries: [{ pathname: '/order-success/5', state: { fresh } }] }
    );

  test('shows confirmation, order id, books, address and amount paid', async () => {
    orderService.details.mockResolvedValue({ order: order(5) });
    renderSuccess();
    expect(await screen.findByText('Order placed successfully!')).toBeInTheDocument();
    expect(screen.getByTestId('order-id')).toHaveTextContent('ORD-100005');
    expect(screen.getByTestId('amount-paid')).toHaveTextContent('630.00');
    expect(screen.getByText('Alpha Book')).toBeInTheDocument();
    expect(screen.getByText(/MG Road/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/books');
  });

  test('downloads a receipt', async () => {
    orderService.details.mockResolvedValue({ order: order(5) });
    const createObjectURL = jest.fn(() => 'blob:x');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = jest.fn();
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderSuccess();
    await userEvent.click(await screen.findByRole('button', { name: 'Download receipt' }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  test('receipt text includes totals and address', () => {
    const text = buildReceipt(order(5, { discount: 50, pointsRedeemed: 50 }));
    expect(text).toContain('ORD-100005');
    expect(text).toContain('Alpha Book');
    expect(text).toContain('Rewards');
    expect(text).toContain('Bengaluru');
  });
});
