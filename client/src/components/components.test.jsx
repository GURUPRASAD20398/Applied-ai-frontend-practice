import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import Pagination from './common/Pagination';
import SearchBar from './common/SearchBar';
import Modal from './common/Modal';
import BookCard from './books/BookCard';
import { renderWithProviders, sampleBook, seedSession, settle } from '../test/utils';
import { cartService, wishlistService } from '../services';

jest.mock('../services', () => ({
  cartService: { get: jest.fn(), add: jest.fn() },
  wishlistService: { get: jest.fn(), add: jest.fn(), remove: jest.fn() },
}));
jest.mock('../services/authService', () => require('../test/authServiceMock'));

const emptyCart = { items: [], summary: { quantity: 0, subtotal: 0, tax: 0, total: 0 } };

beforeEach(() => {
  jest.clearAllMocks();
  cartService.get.mockResolvedValue(emptyCart);
  wishlistService.get.mockResolvedValue({ items: [] });
});

describe('Pagination', () => {
  test('navigates and disables edges', async () => {
    const onChange = jest.fn();
    const { rerender } = renderWithProviders(<Pagination page={1} totalPages={5} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    rerender(<Pagination page={5} totalPages={5} onChange={onChange} />);
  });

  test('renders nothing for a single page', async () => {
    renderWithProviders(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await settle();
  });
});

describe('SearchBar', () => {
  test('navigates to the catalog with the encoded query', async () => {
    const Spy = () => <output data-testid="loc">{useLocation().pathname + useLocation().search}</output>;
    renderWithProviders(
      <>
        <SearchBar />
        <Routes><Route path="*" element={<Spy />} /></Routes>
      </>
    );
    await userEvent.type(screen.getByLabelText(/search books/i), 'harry & co{enter}');
    expect(screen.getByTestId('loc')).toHaveTextContent('/books?search=harry%20%26%20co');
  });
});

describe('Modal', () => {
  test('closes on Escape and exposes dialog semantics', async () => {
    const onClose = jest.fn();
    renderWithProviders(<Modal open title="Hello" onClose={onClose}><p>Body</p></Modal>);
    expect(screen.getByRole('dialog', { name: 'Hello' })).toHaveAttribute('aria-modal', 'true');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('BookCard', () => {
  test('adds to cart when signed in', async () => {
    seedSession();
    cartService.add.mockResolvedValue(emptyCart);
    renderWithProviders(<BookCard book={sampleBook()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add The Lantern Keeper to cart' }));
    expect(cartService.add).toHaveBeenCalledWith(1, 1);
    expect(await screen.findByText(/added to cart/)).toBeInTheDocument();
  });

  test('sends guests to the login page instead of adding', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<BookCard book={sampleBook()} />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    );
    await userEvent.click(screen.getByRole('button', { name: /Add The Lantern Keeper to cart/ }));
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(cartService.add).not.toHaveBeenCalled();
  });

  test('disables the add button when out of stock', async () => {
    renderWithProviders(<BookCard book={sampleBook({ stock: 0 })} />);
    expect(screen.getByRole('button', { name: /Add The Lantern Keeper to cart/ })).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    await settle();
  });

  test('toggles the wishlist', async () => {
    seedSession();
    wishlistService.add.mockResolvedValue({ items: [{ id: 1, bookId: 1, book: sampleBook() }] });
    renderWithProviders(<BookCard book={sampleBook()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add The Lantern Keeper to wishlist' }));
    expect(wishlistService.add).toHaveBeenCalledWith(1);
    expect(await screen.findByRole('button', { name: 'Remove The Lantern Keeper from wishlist' })).toHaveAttribute('aria-pressed', 'true');
  });
});
