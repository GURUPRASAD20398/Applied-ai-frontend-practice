import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';
import StarRating from '../common/StarRating';

/** Compact horizontal card used in recommendation strips and "frequently bought together". */
export default function RecommendationCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="card flex gap-3 p-3 transition-shadow hover:shadow-md">
      <img src={book.image} alt={`Cover of ${book.title}`} loading="lazy" className="h-24 w-16 shrink-0 rounded object-cover" />
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold text-secondary">{book.title}</h3>
        <p className="truncate text-xs text-slate-500">{book.author}</p>
        <StarRating value={book.rating} />
        <p className="mt-1 text-sm font-bold text-secondary">{formatPrice(book.price)}</p>
      </div>
    </Link>
  );
}
