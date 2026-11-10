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
        <h2 id={id} className="text-xl font-bold text-secondary sm:text-2xl">
          {title}
        </h2>
        {to && (
          <Link to={to} className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const COLS = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

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
    <div>
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-secondary to-primary px-6 py-10 text-white sm:px-12 sm:py-16" aria-labelledby="hero-title">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">New season, new stories</p>
        <h1 id="hero-title" className="mt-2 max-w-2xl font-serif text-3xl font-bold leading-tight sm:text-5xl">
          Find your next great read
        </h1>
        <p className="mt-3 max-w-xl text-slate-200">Thousands of stories, ideas and adventures delivered to your door. Earn reward points on every order.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/books" className="btn-accent px-6 py-3">
            Browse books
          </Link>
          <Link to="/books?sort=newest" className="btn rounded-lg border border-white/60 px-6 py-3 text-white hover:bg-white/10">
            New arrivals
          </Link>
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {!data && !error && <Loader label="Loading the store..." />}

      {data && (
        <>
          <Section id="cat-h" title="Shop by category">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.cats.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          </Section>
          <Section id="feat-h" title="Featured books" to="/books">
            <BookGrid books={data.featured} columns={COLS} />
          </Section>
          <Section id="best-h" title="Best sellers" to="/books?sort=rating">
            <BookGrid books={data.best} columns={COLS} />
          </Section>
          <Section id="new-h" title="New arrivals" to="/books?sort=newest">
            <BookGrid books={data.fresh} columns={COLS} />
          </Section>
          <Section id="rec-h" title={data.rec.basedOn === 'history' ? 'Recommended for you' : 'Popular right now'}>
            <BookGrid books={data.rec.items.slice(0, 6)} columns={COLS} />
          </Section>
        </>
      )}
    </div>
  );
}
