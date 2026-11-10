import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { parseError } from '../services/api';
import { formatPrice } from '../utils/format';
import Loader from '../components/common/Loader';
import RecommendedSection from '../components/books/RecommendedSection';

export function OrderSummary({ summary, children }) {
  return (
    <aside className="card h-fit p-5" aria-label="Order summary">
      <h2 className="text-lg font-bold text-secondary">Order summary</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Items</dt><dd data-testid="summary-qty">{summary.quantity}</dd></div>
        <div className="flex justify-between"><dt>Subtotal</dt><dd data-testid="summary-subtotal">{formatPrice(summary.subtotal)}</dd></div>
        <div className="flex justify-between"><dt>Tax (5%)</dt><dd data-testid="summary-tax">{formatPrice(summary.tax)}</dd></div>
        {summary.discount > 0 && (
          <div className="flex justify-between text-green-700"><dt>Reward points ({summary.pointsRedeemed})</dt><dd>-{formatPrice(summary.discount)}</dd></div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-secondary">
          <dt>Grand total</dt>
          <dd data-testid="summary-total">{formatPrice(summary.payable ?? summary.total)}</dd>
        </div>
      </dl>
      {children}
    </aside>
  );
}

function CartRow({ item, onQty, onSave, onRemove, saved, onMove, busy }) {
  const { book } = item;
  return (
    <li className="flex gap-4 py-4">
      <Link to={`/books/${book.id}`}><img src={book.image} alt="" className="h-28 w-20 rounded object-cover" /></Link>
      <div className="min-w-0 flex-1">
        <Link to={`/books/${book.id}`} className="font-semibold text-secondary hover:text-primary">{book.title}</Link>
        <p className="text-xs text-slate-500">by {book.author}</p>
        <p className="mt-1 font-bold">{formatPrice(book.price)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          {!saved && (
            <div className="flex items-center rounded-lg border border-slate-300" role="group" aria-label={`Quantity for ${book.title}`}>
              <button type="button" className="px-3 py-1 text-lg disabled:opacity-40" aria-label={`Decrease quantity of ${book.title}`} disabled={busy || item.quantity <= 1} onClick={() => onQty(item, item.quantity - 1)}>&minus;</button>
              <span className="min-w-8 text-center font-semibold" aria-live="polite">{item.quantity}</span>
              <button type="button" className="px-3 py-1 text-lg disabled:opacity-40" aria-label={`Increase quantity of ${book.title}`} disabled={busy || item.quantity >= 10} onClick={() => onQty(item, item.quantity + 1)}>+</button>
            </div>
          )}
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => (saved ? onMove(item) : onSave(item))} disabled={busy}>
            {saved ? 'Move to cart' : 'Save for later'}
          </button>
          <button type="button" className="font-semibold text-red-600 hover:underline" onClick={() => onRemove(item)} disabled={busy} aria-label={`Remove ${book.title}`}>Remove</button>
        </div>
      </div>
      {!saved && <p className="hidden font-bold sm:block">{formatPrice(book.price * item.quantity)}</p>}
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
      <h1 className="text-2xl font-bold text-secondary">Shopping cart</h1>

      {empty && cart.savedItems.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-lg text-slate-600">Your cart is empty.</p>
          <Link to="/books" className="btn-primary mt-4">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <section className="card px-4" aria-label="Cart items">
              {empty ? (
                <p className="py-6 text-slate-600">No items in your cart. Move something from saved items below.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
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
                <div className="border-t border-slate-100 py-3 text-right">
                  <button type="button" className="text-sm font-semibold text-red-600 hover:underline" disabled={busy} onClick={() => run(() => cart.clear(), 'Cart cleared')}>
                    Clear cart
                  </button>
                </div>
              )}
            </section>

            {cart.savedItems.length > 0 && (
              <section className="card mt-6 px-4" aria-labelledby="saved-h">
                <h2 id="saved-h" className="pt-4 text-lg font-bold text-secondary">Saved for later ({cart.savedItems.length})</h2>
                <ul className="divide-y divide-slate-100">
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
          </div>

          <OrderSummary summary={cart.summary}>
            <button type="button" className="btn-accent mt-4 w-full py-3" disabled={empty || busy} onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
            <Link to="/books" className="mt-2 block text-center text-sm font-semibold text-primary hover:underline">Continue shopping</Link>
          </OrderSummary>
        </div>
      )}

      <RecommendedSection title="Recommended for you" />
    </div>
  );
}
