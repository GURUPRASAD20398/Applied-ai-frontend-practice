import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookService } from '../services';
import useDebounce from '../hooks/useDebounce';
import BookGrid from '../components/books/BookGrid';
import FilterSidebar, { FilterBarFields } from '../components/books/FilterSidebar';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';
import { SearchIcon } from '../components/common/Icons';

const PAGE_SIZE = 12;
const SORTS = [
  ['', 'Relevance'],
  ['price_asc', 'Price: Low to High'],
  ['price_desc', 'Price: High to Low'],
  ['rating', 'Rating'],
  ['newest', 'Newest'],
];
const csv = (v) => (v ? v.split(',').filter(Boolean) : []);

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [facets, setFacets] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      category: csv(params.get('category')),
      author: csv(params.get('author')),
      publisher: csv(params.get('publisher')),
      rating: params.get('rating') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
    }),
    [params]
  );
  const sort = params.get('sort') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const urlSearch = params.get('search') || '';

  // Instant search: local state drives the input, a debounced copy updates the URL.
  const [term, setTerm] = useState(urlSearch);
  const debouncedTerm = useDebounce(term, 300);
  useEffect(() => setTerm(urlSearch), [urlSearch]);

  const update = useCallback(
    (patch, resetPage = true) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) => {
        const value = Array.isArray(v) ? v.join(',') : v;
        if (value) next.set(k, value);
        else next.delete(k);
      });
      if (resetPage) next.delete('page');
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  useEffect(() => {
    if (debouncedTerm.trim() !== urlSearch) update({ search: debouncedTerm.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  useEffect(() => {
    bookService.facets().then(setFacets).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    bookService
      .list({
        search: urlSearch,
        category: filters.category.join(','),
        author: filters.author.join(','),
        publisher: filters.publisher.join(','),
        rating: filters.rating,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort,
        page,
        limit: PAGE_SIZE,
      })
      .then((d) => active && setResult(d))
      .catch(() => active && setError('Unable to load books. Please try again.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [urlSearch, filters, sort, page]);

  const reset = () => {
    setTerm('');
    setParams({}, { replace: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[190px_1fr] lg:gap-8">
      <div className={`${showFilters ? 'block' : 'hidden'} order-2 lg:order-none lg:block`}>
        {facets && <FilterSidebar facets={facets} filters={filters} onChange={update} onReset={reset} />}
      </div>

      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
          <div>
            <label htmlFor="catalog-search" className="mb-1 block text-xs text-muted">
              Search you want to read here
            </label>
            <div className="relative">
              <input
                id="catalog-search"
                type="search"
                className="input pr-10 [&::-webkit-search-cancel-button]:hidden"
                placeholder="Search"
                aria-label="Search the catalog"
                value={term}
                maxLength={100}
                onChange={(e) => setTerm(e.target.value)}
              />
              <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>
          <FilterBarFields facets={facets} filters={filters} onChange={update} />
          <div>
            <label htmlFor="sort" className="mb-1 block text-xs text-muted">
              Sort by
            </label>
            <div className="flex gap-2">
              <select id="sort" className="input" value={sort} onChange={(e) => update({ sort: e.target.value })}>
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-outline lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
                Filters
              </button>
            </div>
          </div>
        </div>

        <section aria-live="polite" aria-busy={loading} className="mt-8">
          <h1 className="text-sm font-normal text-ink">Browse books</h1>
          {error && (
            <p role="alert" className="mt-3 border-l-4 border-danger bg-layer p-4 text-sm text-ink">
              {error}
            </p>
          )}
          {loading && !result && <Loader label="Loading books..." />}
          {result && (
            <>
              <p className="mb-5 mt-1 text-xs text-muted" data-testid="result-count">
                {result.total} {result.total === 1 ? 'book' : 'books'} found
                {urlSearch && (
                  <>
                    {' '}
                    for &ldquo;{urlSearch}&rdquo;
                  </>
                )}
              </p>
              <div className={loading ? 'opacity-60 transition-opacity' : ''}>
                <BookGrid books={result.items} columns="grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" emptyMessage="No books match your search or filters." />
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} onChange={(p) => { update({ page: String(p) }, false); window.scrollTo({ top: 0 }); }} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
