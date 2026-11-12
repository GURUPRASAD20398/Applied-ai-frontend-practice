import { useEffect, useState } from 'react';
import { bookService } from '../../services';
import RecommendationCard from './RecommendationCard';

/** Fetches personalised recommendations ("Recommended for you"). Renders nothing on failure. */
export default function RecommendedSection({ title = 'Recommended for you', limit = 4, columns = 'sm:grid-cols-2 lg:grid-cols-4' }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    let active = true;
    bookService
      .recommendations()
      .then((d) => active && setBooks(d.items.slice(0, limit)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [limit]);

  if (!books.length) return null;
  return (
    <section aria-labelledby="rec-heading" className="mt-10">
      <h2 id="rec-heading" className="mb-4 text-lg font-normal text-ink">
        {title}
      </h2>
      <div className={`grid gap-x-8 gap-y-6 ${columns}`}>
        {books.map((b) => (
          <RecommendationCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}
