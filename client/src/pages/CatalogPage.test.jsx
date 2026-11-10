import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import CatalogPage from './CatalogPage';
import { renderWithProviders, sampleBook } from '../test/utils';
import { bookService } from '../services';

jest.mock('../services', () => ({
  bookService: { list: jest.fn(), facets: jest.fn(), recommendations: jest.fn() },
  cartService: { get: jest.fn() },
  wishlistService: { get: jest.fn() },
}));

const facets = {
  categories: [{ id: 1, name: 'Fiction' }, { id: 2, name: 'Fantasy' }],
  authors: ['Maya Ellison'],
  publishers: ['Northwind Press'],
  priceRange: { min: 199, max: 999 },
};
const result = (items) => ({ items, page: 1, limit: 12, total: items.length, totalPages: 1 });

function LocationSpy() {
  const l = useLocation();
  return <output data-testid="loc">{l.search}</output>;
}

const renderCatalog = (route = '/books') =>
  renderWithProviders(
    <>
      <Routes><Route path="/books" element={<CatalogPage />} /></Routes>
      <LocationSpy />
    </>,
    { route }
  );

beforeEach(() => {
  jest.clearAllMocks();
  bookService.facets.mockResolvedValue(facets);
  bookService.list.mockResolvedValue(result([sampleBook(), sampleBook({ id: 2, title: 'Salt and Ember' })]));
});

describe('CatalogPage search & filters', () => {
  test('renders books and result count', async () => {
    renderCatalog();
    expect(await screen.findByText('Salt and Ember')).toBeInTheDocument();
    expect(screen.getByTestId('result-count')).toHaveTextContent('2 books found');
  });

  test('instant search is debounced and updates the query', async () => {
    renderCatalog();
    await screen.findByText('Salt and Ember');
    bookService.list.mockClear();
    bookService.list.mockResolvedValue(result([sampleBook({ id: 2, title: 'Salt and Ember' })]));

    await userEvent.type(screen.getByLabelText('Search the catalog'), 'ember');

    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('search=ember'));
    await waitFor(() => expect(bookService.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ember' })));
    // debounce: far fewer requests than keystrokes
    expect(bookService.list.mock.calls.length).toBeLessThan(5);
    expect(await screen.findByTestId('result-count')).toHaveTextContent('for “ember”');
  });

  test('applies category, rating and sort filters', async () => {
    renderCatalog();
    await screen.findByText('Salt and Ember');

    await userEvent.click(screen.getByLabelText('Fantasy'));
    await waitFor(() => expect(bookService.list).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Fantasy' })));

    await userEvent.selectOptions(screen.getByLabelText('Minimum rating'), '4');
    await waitFor(() => expect(bookService.list).toHaveBeenLastCalledWith(expect.objectContaining({ rating: '4' })));

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'price_asc');
    await waitFor(() => expect(bookService.list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'price_asc', category: 'Fantasy', rating: '4' })));
  });

  test('shows an empty state when nothing matches', async () => {
    bookService.list.mockResolvedValue(result([]));
    renderCatalog('/books?search=zzz');
    expect(await screen.findByText('No books match your search or filters.')).toBeInTheDocument();
  });

  test('shows an error when the API fails', async () => {
    bookService.list.mockRejectedValue(new Error('boom'));
    renderCatalog();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load books');
  });
});
