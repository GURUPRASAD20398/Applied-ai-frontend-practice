import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../../utils/format';

const STATUS_STYLE = {
  Delivered: 'bg-[#0e6027] text-[#a7f0ba]',
  Shipped: 'bg-[#0043ce] text-[#d0e2ff]',
  Confirmed: 'bg-[#684e00] text-[#fddc69]',
  Pending: 'bg-layer-3 text-ink',
  Cancelled: 'bg-[#a2191f] text-[#ffd7d9]',
};

export default function OrderCard({ order, onBuyAgain, busy }) {
  return (
    <article className="overflow-hidden bg-layer" aria-label={`Order ${order.orderNumber}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-layer-2 px-4 py-3 text-sm">
        <dl className="flex flex-wrap gap-x-8 gap-y-1">
          <div>
            <dt className="text-xs text-subtle">Order ID</dt>
            <dd className="font-semibold text-white">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Date</dt>
            <dd className="text-ink">{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Amount</dt>
            <dd className="font-semibold text-white">{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <span className={`px-3 py-1 text-xs ${STATUS_STYLE[order.status] || STATUS_STYLE.Pending}`}>{order.status}</span>
      </header>
      <ul className="divide-y divide-layer-2 px-4">
        {order.items.map((i) => (
          <li key={i.bookId} className="flex items-center gap-4 py-3">
            <img src={i.image} alt="" className="aspect-[2/3] w-14 bg-canvas object-cover" />
            <div className="min-w-0 flex-1">
              <Link to={`/books/${i.bookId}`} className="line-clamp-1 text-sm text-white hover:text-link">
                {i.title}
              </Link>
              <p className="text-xs text-muted">
                Qty {i.quantity} &times; {formatPrice(i.price)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3">
        <Link to={`/orders/${order.id}`} className="btn-outline">
          View details
        </Link>
        <button type="button" className="btn-primary" onClick={() => onBuyAgain(order)} disabled={busy}>
          {busy ? 'Adding...' : 'Buy again'}
        </button>
      </footer>
    </article>
  );
}
