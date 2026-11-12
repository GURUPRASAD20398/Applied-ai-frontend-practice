import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../services';
import { useAuth } from '../context/AuthContext';
import BookGrid from '../components/books/BookGrid';
import CategoryCard from '../components/books/CategoryCard';
import Loader from '../components/common/Loader';

function Section({ id, title, to, children }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 id={id} className="text-base font-normal text-ink">
          {title}
        </h2>
        {to && (
          <Link to={to} className="text-xs text-link hover:underline">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const COLS = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      bookService.list({ featured: true, limit: 6 }),
      bookService.list({ bestseller: true, sort: 'rating', limit: 6 }),
      bookService.list({ sort: 'newest', limit: 6 }),
      bookService.recommendations(),
      bookService.categories(),
    ])
      .then(([featured, best, fresh, rec, cats]) => {
        if (active) setData({ featured: featured.items, best: best.items, fresh: fresh.items, rec, cats: cats.items });
      })
      .catch(() => active && setError('We could not load the store right now. Please try again shortly.'));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return (
    <div className="grid gap-6 lg:grid-cols-[190px_1fr] lg:gap-8">
      <div className="hidden lg:block">
        {data && (
          <nav aria-label="Categories">
            <Link to="/books" className="block bg-layer-2 px-4 py-2 text-xs text-white shadow-[inset_3px_0_0_#0f62fe]">
              All
            </Link>
            {data.cats.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </nav>
        )}
      </div>

      <div className="min-w-0">
        <section className="bg-layer px-6 py-8 sm:px-10 sm:py-12" aria-labelledby="hero-title">
          <p className="text-xs uppercase tracking-widest text-subtle">New season, new stories</p>
          <h1 id="hero-title" className="mt-2 max-w-2xl text-3xl font-light leading-tight text-white sm:text-4xl">
            Find your next great read
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Thousands of stories, ideas and adventures delivered to your door. Earn reward points on every order.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/books" className="btn-primary px-6 py-3">
              Browse books
            </Link>
            <Link to="/books?sort=newest" className="btn-outline px-6 py-3">
              New arrivals
            </Link>
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-6 border-l-4 border-danger bg-layer p-4 text-sm text-ink">
            {error}
          </p>
        )}
        {!data && !error && <Loader label="Loading the store..." />}

        {data && (
          <>
            <Section id="cat-h" title="Shop by category">
              <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:hidden">
                {data.cats.map((c) => (
                  <div key={c.id} className="bg-canvas">
                    <CategoryCard category={c} />
                  </div>
                ))}
              </div>
              <p className="hidden text-xs text-muted lg:block">Pick a category from the list on the left to start browsing.</p>
            </Section>
            <Section id="rec-h" title={data.rec.basedOn === 'history' ? 'Recommended for You' : 'Popular right now'}>
              <BookGrid books={data.rec.items.slice(0, 6)} columns={COLS} />
            </Section>
            <Section id="best-h" title="Bestsellers this Month" to="/books?sort=rating">
              <BookGrid books={data.best} columns={COLS} />
            </Section>
            <Section id="new-h" title="New Launches" to="/books?sort=newest">
              <BookGrid books={data.fresh} columns={COLS} />
            </Section>
            <Section id="feat-h" title="Featured books" to="/books">
              <BookGrid books={data.featured} columns={COLS} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
