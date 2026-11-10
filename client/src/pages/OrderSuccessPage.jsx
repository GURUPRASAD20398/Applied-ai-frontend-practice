import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderService } from '../services';
import { downloadReceipt } from '../utils/receipt';
import { PAYMENT_LABELS, formatDate, formatLongDate, formatPrice } from '../utils/format';
import Loader from '../components/common/Loader';

/** Shared by the success page (`fresh`) and the order details page. */
export default function OrderSuccessPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const fresh = !!state?.fresh;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    orderService
      .details(id)
      .then((d) => setOrder(d.order))
      .catch(() => setError('We could not find that order.'));
  }, [id]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p role="alert" className="text-slate-700">{error}</p>
        <Link to="/orders" className="btn-primary mt-4">View orders</Link>
      </div>
    );
  }
  if (!order) return <Loader label="Loading order..." />;
  const a = order.address;

  return (
    <div className="mx-auto max-w-3xl">
      {fresh ? (
        <div role="status" className="rounded-2xl bg-green-50 p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-600 text-3xl text-white" aria-hidden="true">&#10003;</div>
          <h1 className="mt-3 text-2xl font-bold text-green-900">Order placed successfully!</h1>
          <p className="mt-1 text-green-800">Thank you for your purchase. A confirmation has been recorded for your order.</p>
        </div>
      ) : (
        <h1 className="text-2xl font-bold text-secondary">Order details</h1>
      )}

      <section className="card mt-6 p-5" aria-label="Order information">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-500">Order ID</dt><dd className="font-bold text-secondary" data-testid="order-id">{order.orderNumber}</dd></div>
          <div><dt className="text-slate-500">Date</dt><dd>{formatDate(order.createdAt)}</dd></div>
          <div><dt className="text-slate-500">Status</dt><dd className="font-semibold">{order.status}</dd></div>
          <div><dt className="text-slate-500">Payment method</dt><dd>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</dd></div>
          {order.estimatedDelivery && <div><dt className="text-slate-500">Estimated delivery</dt><dd>{formatLongDate(order.estimatedDelivery)}</dd></div>}
          <div><dt className="text-slate-500">Amount paid</dt><dd className="text-lg font-bold text-secondary" data-testid="amount-paid">{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <section className="card mt-4 p-5" aria-labelledby="items-h">
        <h2 id="items-h" className="text-lg font-bold text-secondary">Purchased books</h2>
        <ul className="mt-2 divide-y divide-slate-100">
          {order.items.map((i) => (
            <li key={i.bookId} className="flex items-center gap-3 py-3">
              <img src={i.image} alt="" className="h-16 w-11 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/books/${i.bookId}`} className="font-semibold text-secondary hover:text-primary">{i.title}</Link>
                <p className="text-xs text-slate-500">Qty {i.quantity} &times; {formatPrice(i.price)}</p>
              </div>
              <p className="font-semibold">{formatPrice(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{formatPrice(order.tax)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Reward points ({order.pointsRedeemed})</dt><dd>-{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between text-base font-bold text-secondary"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <section className="card mt-4 p-5" aria-labelledby="addr-h">
        <h2 id="addr-h" className="text-lg font-bold text-secondary">Delivery address</h2>
        <address className="mt-2 text-sm not-italic text-slate-700">
          <strong>{a.fullName}</strong><br />
          {a.houseNumber}, {a.street}<br />
          {a.city}, {a.state}, {a.country} - {a.pincode}<br />
          Phone: {a.phone}
        </address>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-outline" onClick={() => downloadReceipt(order)}>Download receipt</button>
        <Link to="/orders" className="btn-outline">My orders</Link>
        <Link to="/books" className="btn-primary">Continue shopping</Link>
      </div>
    </div>
  );
}
