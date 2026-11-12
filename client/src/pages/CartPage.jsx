import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { parseError } from '../services/api';
import { formatPrice, formatShortDate } from '../utils/format';
import Loader from '../components/common/Loader';
import Breadcrumbs from '../components/common/Breadcrumbs';
import RecommendedSection from '../components/books/RecommendedSection';
import { ArrowRightIcon, MinusIcon, PlusIcon } from '../components/common/Icons';

/** "Grand Total" panel (cart + checkout). Props and test ids are unchanged; only the presentation differs. */
export function OrderSummary({ summary, children }) {
  return (
    <aside className="flex flex-col gap-5 bg-layer p-5 sm:flex-row" aria-label="Order summary">
      <img src="/bg-books.svg" alt="" className="hidden h-48 w-36 shrink-0 object-cover sm:block" />
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-normal text-white">Grand Total</h2>
        <dl className="mt-3 space-y-3 text-xs">
          <div className="flex justify-between"><dt className="text-muted">Items</dt><dd data-testid="summary-qty" className="text-ink">{summary.quantity}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd data-testid="summary-subtotal" className="text-ink">{formatPrice(summary.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tax (5%)</dt><dd data-testid="summary-tax" className="text-ink">{formatPrice(summary.tax)}</dd></div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-success"><dt>Reward points ({summary.pointsRedeemed})</dt><dd>-{formatPrice(summary.discount)}</dd></div>
          )}
          <div className="flex justify-between border-t border-layer-3 pt-3 text-sm font-semibold text-white">
            <dt>Total Amount</dt>
            <dd data-testid="summary-total">{formatPrice(summary.payable ?? summary.total)}</dd>
          </div>
        </dl>
        {children}
      </div>
    </aside>
  );
}

function Stepper({ item, onQty, busy }) {
  const { book } = item;
  return (
    <div className="inline-flex items-center border-b border-subtle text-sm" role="group" aria-label={`Quantity for ${book.title}`}>
      <span className="min-w-10 px-3 text-center" aria-live="polite">{item.quantity}</span>
      <button type="button" className="grid h-9 w-9 place-items-center hover:bg-layer-2 disabled:opacity-40" aria-label={`Decrease quantity of ${book.title}`} disabled={busy || item.quantity <= 1} onClick={() => onQty(item, item.quantity - 1)}><MinusIcon /></button>
      <button type="button" className="grid h-9 w-9 place-items-center hover:bg-layer-2 disabled:opacity-40" aria-label={`Increase quantity of ${book.title}`} disabled={busy || item.quantity >= 10} onClick={() => onQty(item, item.quantity + 1)}><PlusIcon /></button>
    </div>
  );
}

function CartRow({ item, onQty, onSave, onRemove, saved, onMove, busy }) {
  const { book } = item;
  return (
    <li className="flex gap-4">
      <Link to={`/books/${book.id}`} className="shrink-0"><img src={book.image} alt="" className="aspect-[2/3] w-28 bg-canvas object-cover sm:w-36" /></Link>
      <div className="flex min-w-0 flex-1 flex-col text-xs text-muted">
        <Link to={`/books/${book.id}`} className="text-base leading-snug text-white hover:text-link">{book.title}</Link>
        <p className="mt-2">by <span className="text-link underline">{book.author}</span></p>
        {book.description && <p className="mt-2 line-clamp-2">{book.description}</p>}
        {book.category && <p className="mt-3 text-link underline">{book.category}</p>}
        <p className="mt-3 text-xl font-semibold text-white">{formatPrice(book.price)}</p>
        {book.expectedDelivery && <p>Delivery by {formatShortDate(book.expectedDelivery)}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {!saved && <Stepper item={item} onQty={onQty} busy={busy} />}
          <button type="button" className="text-link hover:underline disabled:opacity-50" onClick={() => (saved ? onMove(item) : onSave(item))} disabled={busy}>
            {saved ? 'Move to cart' : 'Save for later'}
          </button>
          <button type="button" className="text-danger hover:underline disabled:opacity-50" onClick={() => onRemove(item)} disabled={busy} aria-label={`Remove ${book.title}`}>Remove</button>
        </div>
        {!saved && <p className="mt-2 hidden text-subtle sm:block">Line total: {formatPrice(book.price * item.quantity)}</p>}
      </div>
    </li>
  );
}

export default function CartPage() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setBusy(false);
    }
  };

  if (cart.loading && !cart.items.length) return <Loader label="Loading your cart..." />;

  const empty = cart.activeItems.length === 0;
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Books', to: '/books' }, { label: 'Cart' }]} />
      <h1 className="text-xl font-normal text-white">Shopping cart</h1>

      {empty && cart.savedItems.length === 0 ? (
        <div className="mt-4 bg-layer p-10 text-center">
          <p className="text-lg text-muted">Your cart is empty.</p>
          <Link to="/books" className="btn-primary mt-4">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <section className="bg-layer p-5" aria-label="Cart items">
            {empty ? (
              <p className="py-2 text-sm text-muted">No items in your cart. Move something from saved items below.</p>
            ) : (
              <ul className="grid gap-8 lg:grid-cols-2 2xl:grid-cols-3">
                {cart.activeItems.map((i) => (
                  <CartRow
                    key={i.id}
                    item={i}
                    busy={busy}
                    onQty={(it, q) => run(() => cart.updateQuantity(it.id, q))}
                    onSave={(it) => run(() => cart.setSavedForLater(it.id, true), 'Saved for later')}
                    onRemove={(it) => run(() => cart.remove(it.id), 'Item removed')}
                  />
                ))}
              </ul>
            )}
            {!empty && (
              <div className="mt-4 border-t border-layer-2 pt-3 text-right">
                <button type="button" className="text-xs text-danger hover:underline disabled:opacity-50" disabled={busy} onClick={() => run(() => cart.clear(), 'Cart cleared')}>
                  Clear cart
                </button>
              </div>
            )}
          </section>

          {cart.savedItems.length > 0 && (
            <section className="bg-layer p-5" aria-labelledby="saved-h">
              <h2 id="saved-h" className="mb-4 text-base font-normal text-white">Saved for later ({cart.savedItems.length})</h2>
              <ul className="grid gap-8 lg:grid-cols-2 2xl:grid-cols-3">
                {cart.savedItems.map((i) => (
                  <CartRow
                    key={i.id}
                    item={i}
                    saved
                    busy={busy}
                    onMove={(it) => run(() => cart.setSavedForLater(it.id, false), 'Moved to cart')}
                    onRemove={(it) => run(() => cart.remove(it.id), 'Item removed')}
                  />
                ))}
              </ul>
            </section>
          )}

          <div className="ml-auto max-w-xl">
            <OrderSummary summary={cart.summary}>
              <button type="button" className="btn-primary mt-5 w-full justify-between" disabled={empty || busy} onClick={() => navigate('/checkout')}>
                Proceed to checkout
                <ArrowRightIcon />
              </button>
              <Link to="/books" className="mt-3 block text-center text-xs text-link hover:underline">Continue shopping</Link>
            </OrderSummary>
          </div>
        </div>
      )}

      <RecommendedSection title="Recommended for you" />
    </div>
  );
}
