import { Link, useNavigate } from 'react-router-dom';
import StarRating from '../common/StarRating';
import { BookmarkIcon, CartIcon } from '../common/Icons';
import { formatPrice, formatShortDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { parseError } from '../../services/api';

export default function BookCard({ book }) {
  const { isAuthenticated } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const wished = wishlist.has(book.id);

  const requireLogin = () => {
    toast.info('Please sign in to continue');
    navigate('/login', { state: { from: `/books/${book.id}` } });
  };

  const addToCart = async () => {
    if (!isAuthenticated) return requireLogin();
    try {
      await cart.add(book.id, 1);
      toast.success(`"${book.title}" added to cart`);
    } catch (e) {
      toast.error(parseError(e).message);
    }
    return undefined;
  };

  const toggleWish = async () => {
    if (!isAuthenticated) return requireLogin();
    try {
      if (wished) await wishlist.remove(book.id);
      else await wishlist.add(book.id);
      toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (e) {
      toast.error(parseError(e).message);
    }
    return undefined;
  };

  return (
    <article className="group flex h-full gap-4">
      <div className="relative w-28 shrink-0 sm:w-32 lg:w-36">
        <Link to={`/books/${book.id}`} aria-label={`View ${book.title}`}>
          <img src={book.image} alt={`Cover of ${book.title}`} loading="lazy" className="aspect-[2/3] w-full bg-layer object-cover" />
        </Link>
        {book.stock === 0 && <span className="absolute left-0 top-0 bg-layer-2 px-2 py-0.5 text-xs text-white">Out of stock</span>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col text-xs">
        <h3 className="line-clamp-2 text-base font-normal leading-snug text-ink">
          <Link to={`/books/${book.id}`} className="text-ink hover:text-link">
            {book.title}
          </Link>
        </h3>
        <p className="mt-2 text-muted">
          by{' '}
          <Link to={`/books?author=${encodeURIComponent(book.author)}`} className="text-link underline">
            {book.author}
          </Link>
        </p>
        {book.description && <p className="mt-2 line-clamp-2 text-muted">{book.description}</p>}
        <div className="mt-2">
          <StarRating value={book.rating} count={book.reviewCount} />
        </div>
        {book.category && (
          <p className="mt-2">
            <Link to={`/books?category=${encodeURIComponent(book.category)}`} className="text-link underline">
              {book.category}
            </Link>
          </p>
        )}
        <p className="mt-3 text-xl font-semibold text-white">{formatPrice(book.price)}</p>
        {book.expectedDelivery && <p className="text-muted">Delivery by {formatShortDate(book.expectedDelivery)}</p>}

        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            type="button"
            className="btn-primary gap-2 px-3 py-1.5 text-xs"
            onClick={addToCart}
            disabled={book.stock === 0}
            aria-label={`Add ${book.title} to cart`}
          >
            Add to cart
            <CartIcon width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={toggleWish}
            aria-pressed={wished}
            aria-label={wished ? `Remove ${book.title} from wishlist` : `Add ${book.title} to wishlist`}
            className={`grid h-8 w-8 place-items-center bg-layer-2 hover:bg-layer-3 ${wished ? 'text-white' : 'text-muted'}`}
          >
            <BookmarkIcon className={wished ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
    </article>
  );
}
