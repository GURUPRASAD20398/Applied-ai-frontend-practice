import { Link, useNavigate } from 'react-router-dom';
import StarRating from '../common/StarRating';
import { formatPrice } from '../../utils/format';
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
    <article className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative bg-slate-100">
        <Link to={`/books/${book.id}`} aria-label={`View ${book.title}`}>
          <img src={book.image} alt={`Cover of ${book.title}`} loading="lazy" className="mx-auto aspect-[2/3] w-full object-cover" />
        </Link>
        <button
          type="button"
          onClick={toggleWish}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${book.title} from wishlist` : `Add ${book.title} to wishlist`}
          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none shadow hover:bg-white"
        >
          <span className={wished ? 'text-red-500' : 'text-slate-400'} aria-hidden="true">
            {wished ? '♥' : '♡'}
          </span>
        </button>
        {book.stock === 0 && (
          <span className="absolute left-2 top-2 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">Out of stock</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-secondary">
          <Link to={`/books/${book.id}`} className="hover:text-primary">
            {book.title}
          </Link>
        </h3>
        <p className="text-xs text-slate-500">by {book.author}</p>
        <StarRating value={book.rating} count={book.reviewCount} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-secondary">{formatPrice(book.price)}</span>
          <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={addToCart} disabled={book.stock === 0} aria-label={`Add ${book.title} to cart`}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
