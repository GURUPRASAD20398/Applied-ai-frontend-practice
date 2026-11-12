import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderService } from '../services';
import { downloadReceipt } from '../utils/receipt';
import { PAYMENT_LABELS, formatDate, formatLongDate, formatPrice } from '../utils/format';
import Loader from '../components/common/Loader';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { ArrowRightIcon, CheckIcon } from '../components/common/Icons';

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
        <p role="alert" className="text-ink">{error}</p>
        <Link to="/orders" className="btn-primary mt-4">View orders</Link>
      </div>
    );
  }
  if (!order) return <Loader label="Loading order..." />;
  const a = order.address;

  const info = (
    <dl className="grid gap-4 text-xs sm:grid-cols-3">
      <div><dt className="text-subtle">Order ID</dt><dd className="mt-1 text-sm font-semibold text-white" data-testid="order-id">{order.orderNumber}</dd></div>
      <div><dt className="text-subtle">Date</dt><dd className="mt-1 text-sm text-ink">{formatDate(order.createdAt)}</dd></div>
      <div><dt className="text-subtle">Status</dt><dd className="mt-1 text-sm text-ink">{order.status}</dd></div>
      <div><dt className="text-subtle">Payment method</dt><dd className="mt-1 text-sm text-ink">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</dd></div>
      {order.estimatedDelivery && <div><dt className="text-subtle">Estimated delivery</dt><dd className="mt-1 text-sm text-ink">{formatLongDate(order.estimatedDelivery)}</dd></div>}
      <div><dt className="text-subtle">Amount paid</dt><dd className="mt-1 text-lg font-semibold text-white" data-testid="amount-paid">{formatPrice(order.total)}</dd></div>
    </dl>
  );

  const books = (
    <ul className="grid gap-6 sm:grid-cols-2">
      {order.items.map((i) => (
        <li key={i.bookId} className="flex gap-4">
          <img src={i.image} alt="" className="aspect-[2/3] w-24 shrink-0 bg-canvas object-cover sm:w-28" />
          <div className="min-w-0 text-xs text-muted">
            <Link to={`/books/${i.bookId}`} className="text-base leading-snug text-white hover:text-link">{i.title}</Link>
            <p className="mt-2">Qty {i.quantity} &times; {formatPrice(i.price)}</p>
            <p className="mt-2 text-xl font-semibold text-white">{formatPrice(i.price * i.quantity)}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  const totals = (
    <dl className="mt-4 space-y-2 border-t border-layer-3 pt-3 text-xs">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-ink">{formatPrice(order.subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="text-ink">{formatPrice(order.tax)}</dd></div>
      {order.discount > 0 && <div className="flex justify-between text-success"><dt>Reward points ({order.pointsRedeemed})</dt><dd>-{formatPrice(order.discount)}</dd></div>}
      <div className="flex justify-between text-sm font-semibold text-white"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
    </dl>
  );

  const address = (
    <address className="text-xs not-italic leading-relaxed text-muted">
      <strong className="text-ink">{a.fullName}</strong><br />
      {a.houseNumber}, {a.street}<br />
      {a.city}, {a.state}, {a.country} - {a.pincode}<br />
      Phone: {a.phone}
    </address>
  );

  if (fresh) {
    return (
      <section className="w-full max-w-3xl bg-layer p-6 text-ink sm:p-8" aria-label="Purchase confirmation">
        <div role="status" className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#24a148] text-white" aria-hidden="true">
            <CheckIcon width={26} height={26} strokeWidth={2} />
          </div>
          <h1 className="sr-only">Order placed successfully!</h1>
          <p className="mx-auto mt-5 max-w-xs text-lg text-white">Your purchase of the following reads is successful</p>
        </div>

        <div className="mt-8">{books}</div>
        {totals}

        <div className="mt-6 grid gap-6 border-t border-layer-3 pt-5 md:grid-cols-[1fr_auto]">
          {info}
          <div>
            <h2 className="mb-2 text-xs text-subtle">Delivery address</h2>
            {address}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn-outline" onClick={() => downloadReceipt(order)}>Download receipt</button>
          <Link to="/orders" className="btn-outline">My orders</Link>
          <Link to="/books" className="btn-primary min-w-56 justify-between">
            Continue shopping
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Orders', to: '/orders' }, { label: order.orderNumber }]} />
      <h1 className="text-xl font-normal text-white">Order details</h1>

      <section className="mt-4 bg-layer p-5" aria-label="Order information">{info}</section>

      <section className="mt-4 bg-layer p-5" aria-labelledby="items-h">
        <h2 id="items-h" className="mb-4 text-base font-normal text-white">Purchased books</h2>
        {books}
        {totals}
      </section>

      <section className="mt-4 bg-layer p-5" aria-labelledby="addr-h">
        <h2 id="addr-h" className="mb-2 text-base font-normal text-white">Delivery address</h2>
        {address}
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-outline" onClick={() => downloadReceipt(order)}>Download receipt</button>
        <Link to="/orders" className="btn-outline">My orders</Link>
        <Link to="/books" className="btn-primary min-w-56 justify-between">
          Continue shopping
          <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
}
