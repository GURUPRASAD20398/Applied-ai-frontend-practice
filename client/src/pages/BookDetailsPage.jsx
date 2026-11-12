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
import Breadcrumbs from '../components/common/Breadcrumbs';
import RecommendationCard from '../components/books/RecommendationCard';
import { BookmarkIcon, CartIcon } from '../components/common/Icons';

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
        <p role="alert" className="text-lg text-ink">{error}</p>
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
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Books', to: '/books' },
          { label: book.category, to: `/books?category=${encodeURIComponent(book.category)}` },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="grid gap-6 md:grid-cols-[minmax(220px,300px)_1fr]">
            <div>
              <img src={book.image} alt={`Cover of ${book.title}`} className="mx-auto aspect-[2/3] w-full max-w-xs bg-layer object-cover md:max-w-none" />
            </div>

            <div className="min-w-0 text-xs text-muted">
              <h1 className="text-2xl font-normal text-white">{book.title}</h1>
              <p className="mt-2">
                by <Link to={`/books?author=${encodeURIComponent(book.author)}`} className="text-link underline">{book.author}</Link>
              </p>
              <p className="mt-2">{book.description}</p>
              {book.publisher && <p className="mt-5">Published by: <span className="text-link underline">{book.publisher}</span></p>}
              <p className="mt-5">
                <Link to={`/books?category=${encodeURIComponent(book.category)}`} className="text-link underline">{book.category}</Link>
              </p>

              <p className="mt-6 text-3xl font-semibold text-white">{formatPrice(book.price)}</p>
              <p className={`mt-1 ${inStock ? 'text-muted' : 'text-danger'}`}>
                {inStock ? (book.stock <= 5 ? `Only ${book.stock} left in stock` : 'In stock') : 'Currently unavailable'}
              </p>
              {inStock && <p className="text-muted">Delivery by <strong className="font-semibold text-ink">{formatLongDate(book.expectedDelivery)}</strong></p>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="btn-primary min-w-40 justify-between" onClick={addToCart} disabled={!inStock || busy}>
                  Add to cart
                  <CartIcon width={16} height={16} />
                </button>
                <button type="button" className="btn-outline min-w-44 justify-between" onClick={toggleWishlist} disabled={busy} aria-pressed={wished}>
                  {wished ? 'In wishlist' : 'Add to wishlist'}
                  <BookmarkIcon className={wished ? 'fill-current' : ''} />
                </button>
                <button type="button" className="btn-outline" onClick={buyNow} disabled={!inStock || busy}>Buy now</button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
                <div>
                  <p className="text-subtle">Rating</p>
                  <p className="mt-1"><StarRating value={book.rating} count={book.reviewCount} /> <span className="text-subtle">ratings</span></p>
                </div>
                <div>
                  <p className="text-subtle">Delivery time</p>
                  <p className="mt-1 text-ink">{book.deliveryDays} days</p>
                </div>
              </div>
            </div>
          </div>

          <section aria-labelledby="desc-h" className="mt-8">
            <h2 id="desc-h" className="text-base font-normal text-white">About this book</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">{book.description}</p>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {[
                ['Publisher', book.publisher],
                ['ISBN', book.isbn],
                ['Category', book.category],
                ['Published', book.publishedDate],
                ['Reviews', book.reviewCount.toLocaleString('en-IN')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line py-2 text-xs">
                  <dt className="text-subtle">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {fbt.length > 0 && (
            <section aria-labelledby="fbt-h" className="mt-10 bg-layer p-5">
              <h2 id="fbt-h" className="text-base font-normal text-white">Frequently bought together</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {bundle.map((b) => <RecommendationCard key={b.id} book={b} />)}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Total for {bundle.length} books: <strong className="text-white">{formatPrice(bundleTotal)}</strong></p>
                <button type="button" className="btn-primary" onClick={addBundle} disabled={busy}>Add all to cart</button>
              </div>
            </section>
          )}
        </div>

        {related.length > 0 && (
          <aside aria-labelledby="rel-h" className="lg:border-l lg:border-line lg:pl-6">
            <h2 id="rel-h" className="mb-4 text-base font-normal text-white">Related Reads</h2>
            <div className="space-y-6">
              {related.map((b) => <RecommendationCard key={b.id} book={b} />)}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
