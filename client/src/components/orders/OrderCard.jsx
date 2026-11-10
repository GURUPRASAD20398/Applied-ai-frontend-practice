import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../../utils/format';

const STATUS_STYLE = {
  Delivered: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-amber-100 text-amber-800',
  Pending: 'bg-slate-100 text-slate-700',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function OrderCard({ order, onBuyAgain, busy }) {
  return (
    <article className="card overflow-hidden" aria-label={`Order ${order.orderNumber}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <dl className="flex flex-wrap gap-x-8 gap-y-1">
          <div>
            <dt className="text-xs text-slate-500">Order ID</dt>
            <dd className="font-semibold text-secondary">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Date</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Amount</dt>
            <dd className="font-semibold">{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[order.status] || STATUS_STYLE.Pending}`}>{order.status}</span>
      </header>
      <ul className="divide-y divide-slate-100 px-4">
        {order.items.map((i) => (
          <li key={i.bookId} className="flex items-center gap-3 py-3">
            <img src={i.image} alt="" className="h-16 w-11 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <Link to={`/books/${i.bookId}`} className="line-clamp-1 text-sm font-semibold text-secondary hover:text-primary">
                {i.title}
              </Link>
              <p className="text-xs text-slate-500">
                Qty {i.quantity} &times; {formatPrice(i.price)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
        <Link to={`/orders/${order.id}`} className="btn-outline">
          View details
        </Link>
        <button type="button" className="btn-accent" onClick={() => onBuyAgain(order)} disabled={busy}>
          {busy ? 'Adding...' : 'Buy again'}
        </button>
      </footer>
    </article>
  );
}
