import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import CartPage from './CartPage';
import { renderWithProviders, sampleBook, seedSession } from '../test/utils';
import { cartService, bookService } from '../services';

jest.mock('../services', () => ({
  cartService: { get: jest.fn(), add: jest.fn(), update: jest.fn(), remove: jest.fn(), clear: jest.fn() },
  wishlistService: { get: jest.fn() },
  bookService: { recommendations: jest.fn() },
}));
jest.mock('../services/authService', () => require('../test/authServiceMock'));

const row = (id, book, quantity = 1, savedForLater = false) => ({ id, bookId: book.id, quantity, savedForLater, book });
const state = (items) => {
  const active = items.filter((i) => !i.savedForLater);
  const subtotal = active.reduce((t, i) => t + i.book.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  return { items, summary: { quantity: active.reduce((t, i) => t + i.quantity, 0), subtotal, tax, total: subtotal + tax } };
};

const a = sampleBook({ id: 1, title: 'Alpha Book', price: 300 });
const b = sampleBook({ id: 2, title: 'Beta Book', price: 200 });

const renderCart = () =>
  renderWithProviders(
    <Routes>
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<p>Checkout page</p>} />
    </Routes>,
    { route: '/cart' }
  );

beforeEach(() => {
  jest.clearAllMocks();
  seedSession();
  bookService.recommendations.mockResolvedValue({ items: [sampleBook({ id: 9, title: 'Recommended One' })], basedOn: 'history' });
});

describe('CartPage', () => {
  test('shows items with quantity, subtotal, tax and grand total', async () => {
    cartService.get.mockResolvedValue(state([row(1, a, 2), row(2, b, 1)]));
    renderCart();
    expect(await screen.findByText('Alpha Book')).toBeInTheDocument();
    expect(screen.getByTestId('summary-qty')).toHaveTextContent('3');
    expect(screen.getByTestId('summary-subtotal')).toHaveTextContent('800.00');
    expect(screen.getByTestId('summary-tax')).toHaveTextContent('40.00');
    expect(screen.getByTestId('summary-total')).toHaveTextContent('840.00');
    expect(await screen.findByText('Recommended One')).toBeInTheDocument();
  });

  test('updates quantity', async () => {
    cartService.get.mockResolvedValue(state([row(1, a, 1)]));
    cartService.update.mockResolvedValue(state([row(1, a, 2)]));
    renderCart();
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity of Alpha Book' }));
    expect(cartService.update).toHaveBeenCalledWith(1, { quantity: 2 });
    await waitFor(() => expect(screen.getByTestId('summary-qty')).toHaveTextContent('2'));
  });

  test('removes an item and shows the empty state', async () => {
    cartService.get.mockResolvedValue(state([row(1, a, 1)]));
    cartService.remove.mockResolvedValue(state([]));
    renderCart();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Alpha Book' }));
    expect(cartService.remove).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
  });

  test('save for later moves the item to the saved list and excludes it from totals', async () => {
    cartService.get.mockResolvedValue(state([row(1, a, 1), row(2, b, 1)]));
    cartService.update.mockResolvedValue(state([row(1, a, 1, true), row(2, b, 1)]));
    renderCart();
    const cartList = await screen.findByRole('region', { name: 'Cart items' });
    await userEvent.click(within(cartList).getAllByRole('button', { name: 'Save for later' })[0]);
    expect(cartService.update).toHaveBeenCalledWith(1, { savedForLater: true });
    expect(await screen.findByRole('heading', { name: /Saved for later \(1\)/ })).toBeInTheDocument();
    expect(screen.getByTestId('summary-subtotal')).toHaveTextContent('200.00');
  });

  test('clears the cart', async () => {
    cartService.get.mockResolvedValue(state([row(1, a, 1)]));
    cartService.clear.mockResolvedValue(state([]));
    renderCart();
    await userEvent.click(await screen.findByRole('button', { name: 'Clear cart' }));
    expect(cartService.clear).toHaveBeenCalled();
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
  });

  test('proceeds to checkout', async () => {
    cartService.get.mockResolvedValue(state([row(1, a, 1)]));
    renderCart();
    await userEvent.click(await screen.findByRole('button', { name: 'Proceed to checkout' }));
    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
  });
});
