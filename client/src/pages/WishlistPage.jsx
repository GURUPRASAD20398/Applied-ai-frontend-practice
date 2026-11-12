import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { parseError } from '../services/api';
import { formatPrice } from '../utils/format';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function WishlistPage() {
  const wishlist = useWishlist();
  const cart = useCart();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  const run = async (id, fn, msg) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Wishlist' }]} />
      <h1 className="text-xl font-normal text-white">My wishlist</h1>
      {wishlist.items.length === 0 ? (
        <div className="mt-4 bg-layer p-10 text-center">
          <p className="text-lg text-muted">Your wishlist is empty.</p>
          <Link to="/books" className="btn-primary mt-4">Discover books</Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {wishlist.items.map(({ book }) => (
            <li key={book.id} className="flex gap-4 bg-layer p-4">
              <Link to={`/books/${book.id}`}><img src={book.image} alt="" className="aspect-[2/3] w-24 bg-canvas object-cover sm:w-28" /></Link>
              <div className="flex min-w-0 flex-1 flex-col text-xs text-muted">
                <Link to={`/books/${book.id}`} className="text-base leading-snug text-white hover:text-link">{book.title}</Link>
                <p className="mt-2">by <span className="text-link underline">{book.author}</span></p>
                <p className="mt-2 text-xl font-semibold text-white">{formatPrice(book.price)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <button
                    type="button"
                    className="btn-primary px-3 py-1.5 text-xs"
                    disabled={busyId === book.id || book.stock === 0}
                    onClick={() => run(book.id, async () => { await wishlist.moveToCart(book.id); await cart.refresh(); }, 'Moved to cart')}
                  >
                    {book.stock === 0 ? 'Out of stock' : 'Move to cart'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline px-3 py-1.5 text-xs"
                    disabled={busyId === book.id}
                    onClick={() => run(book.id, () => wishlist.remove(book.id), 'Removed from wishlist')}
                    aria-label={`Remove ${book.title} from wishlist`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
