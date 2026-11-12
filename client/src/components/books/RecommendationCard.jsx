import { Link } from 'react-router-dom';
import { formatPrice, formatShortDate } from '../../utils/format';
import StarRating from '../common/StarRating';

/** Compact horizontal card used in "Related Reads", recommendation strips and "frequently bought together". */
export default function RecommendationCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="flex gap-4 text-xs text-muted hover:bg-layer/60">
      <img src={book.image} alt={`Cover of ${book.title}`} loading="lazy" className="aspect-[2/3] w-24 shrink-0 bg-layer object-cover sm:w-28" />
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-base font-normal leading-snug text-ink">{book.title}</h3>
        <p className="mt-2 truncate">
          by <span className="text-link underline">{book.author}</span>
        </p>
        {book.description && <p className="mt-2 line-clamp-2">{book.description}</p>}
        <div className="mt-2">
          <StarRating value={book.rating} />
        </div>
        {book.category && <p className="mt-2 text-link underline">{book.category}</p>}
        <p className="mt-2 text-xl font-semibold text-white">{formatPrice(book.price)}</p>
        {book.expectedDelivery && <p>Delivery by {formatShortDate(book.expectedDelivery)}</p>}
      </div>
    </Link>
  );
}
