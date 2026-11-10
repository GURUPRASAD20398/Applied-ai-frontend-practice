import { MemoryRouter } from 'react-router-dom';
import { act, render } from '@testing-library/react';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import Toast from '../components/common/Toast';

/** Renders UI inside every provider the app uses. Services are mocked per-test with jest.mock. */
export function renderWithProviders(ui, { route = '/', initialEntries } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries || [route]}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>{ui}</WishlistProvider>
            <Toast />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

/** Lets provider mount-fetches (session, cart, wishlist) resolve inside act(). */
export const settle = () => act(async () => {});

export const sampleBook = (over = {}) => ({
  id: 1,
  title: 'The Lantern Keeper',
  author: 'Maya Ellison',
  category: 'Fiction',
  publisher: 'Northwind Press',
  price: 300,
  rating: 4.5,
  reviewCount: 120,
  stock: 10,
  image: '/covers/1.svg',
  ...over,
});

export const seedSession = (user = { id: 2, name: 'Asha Verma', email: 'user@bookstore.com', role: 'customer', rewardPoints: 500 }) =>
  window.localStorage.setItem('ebs_session', JSON.stringify({ token: 't', user }));
