import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookService } from '../services';
import { parseError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatLongDate, formatPrice } from '../utils/format';
import StarRating from '../components/common/StarRating';
import Loader from '../components/common/Loader';
import BookGrid from '../components/books/BookGrid';
import RecommendationCard from '../components/books/RecommendationCard';

export default function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    bookService
      .details(id)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.response?.status === 404 ? 'This book could not be found.' : parseError(e).message));
    window.scrollTo({ top: 0 });
    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p role="alert" className="text-lg text-slate-700">{error}</p>
        <Link to="/books" className="btn-primary mt-4">Back to catalog</Link>
      </div>
    );
  }
  if (!data) return <Loader label="Loading book..." />;

  const { book, related, frequentlyBoughtTogether: fbt } = data;
  const wished = wishlist.has(book.id);
  const inStock = book.stock > 0;

  const guard = async (fn, successMsg) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to continue');
      navigate('/login', { state: { from: `/books/${book.id}` } });
      return false;
    }
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (e) {
      toast.error(parseError(e).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addToCart = () => guard(() => cart.add(book.id, 1), `"${book.title}" added to cart`);
  const buyNow = async () => {
    if (await guard(() => cart.add(book.id, 1))) navigate('/checkout');
  };
  const toggleWishlist = () =>
    guard(() => (wished ? wishlist.remove(book.id) : wishlist.add(book.id)), wished ? 'Removed from wishlist' : 'Added to wishlist');
  const addBundle = () =>
    guard(async () => {
      await Promise.all([book, ...fbt].filter((b) => b.stock > 0).map((b) => cart.add(b.id, 1)));
    }, 'Bundle added to cart');

  const bundle = [book, ...fbt];
  const bundleTotal = bundle.reduce((t, b) => t + b.price, 0);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/books" className="hover:text-primary">Books</Link> /{' '}
        <Link to={`/books?category=${encodeURIComponent(book.category)}`} className="hover:text-primary">{book.category}</Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <img src={book.image} alt={`Cover of ${book.title}`} className="mx-auto w-full max-w-xs rounded-xl shadow-lg" />
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-secondary">{book.title}</h1>
          <p className="mt-1 text-slate-600">
            by <Link to={`/books?author=${encodeURIComponent(book.author)}`} className="font-semibold text-primary hover:underline">{book.author}</Link>
          </p>
          <div className="mt-2"><StarRating value={book.rating} count={book.reviewCount} /> <span className="text-sm text-slate-500">ratings</span></div>

          <p className="mt-4 text-3xl font-bold text-secondary">{formatPrice(book.price)}</p>
          <p className={`mt-1 text-sm font-semibold ${inStock ? 'text-green-700' : 'text-red-600'}`}>
            {inStock ? (book.stock <= 5 ? `Only ${book.stock} left in stock` : 'In stock') : 'Currently unavailable'}
          </p>
          {inStock && <p className="text-sm text-slate-600">Delivery by <strong>{formatLongDate(book.expectedDelivery)}</strong></p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn-primary px-6 py-3" onClick={addToCart} disabled={!inStock || busy}>Add to cart</button>
            <button type="button" className="btn-accent px-6 py-3" onClick={buyNow} disabled={!inStock || busy}>Buy now</button>
            <button type="button" className="btn-outline px-6 py-3" onClick={toggleWishlist} disabled={busy} aria-pressed={wished}>
              {wished ? '♥ In wishlist' : '♡ Add to wishlist'}
            </button>
          </div>

          <section aria-labelledby="desc-h" className="mt-8">
            <h2 id="desc-h" className="text-lg font-bold text-secondary">About this book</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{book.description}</p>
          </section>

          <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ['Publisher', book.publisher],
              ['ISBN', book.isbn],
              ['Category', book.category],
              ['Published', book.publishedDate],
              ['Reviews', book.reviewCount.toLocaleString('en-IN')],
              ['Delivery time', `${book.deliveryDays} days`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-200 py-1.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {fbt.length > 0 && (
        <section aria-labelledby="fbt-h" className="card mt-10 p-5">
          <h2 id="fbt-h" className="text-xl font-bold text-secondary">Frequently bought together</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bundle.map((b) => <RecommendationCard key={b.id} book={b} />)}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Total for {bundle.length} books: <strong className="text-secondary">{formatPrice(bundleTotal)}</strong></p>
            <button type="button" className="btn-primary" onClick={addBundle} disabled={busy}>Add all to cart</button>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="rel-h" className="mt-10">
          <h2 id="rel-h" className="mb-4 text-xl font-bold text-secondary">Related books</h2>
          <BookGrid books={related} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />
        </section>
      )}
    </div>
  );
}
