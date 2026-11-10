import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { parseError } from '../services/api';
import { formatPrice } from '../utils/format';

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
      <h1 className="text-2xl font-bold text-secondary">My wishlist</h1>
      {wishlist.items.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-lg text-slate-600">Your wishlist is empty.</p>
          <Link to="/books" className="btn-primary mt-4">Discover books</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {wishlist.items.map(({ book }) => (
            <li key={book.id} className="card flex gap-4 p-4">
              <Link to={`/books/${book.id}`}><img src={book.image} alt="" className="h-32 w-22 rounded object-cover" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/books/${book.id}`} className="font-semibold text-secondary hover:text-primary">{book.title}</Link>
                <p className="text-xs text-slate-500">by {book.author}</p>
                <p className="mt-1 font-bold">{formatPrice(book.price)}</p>
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
