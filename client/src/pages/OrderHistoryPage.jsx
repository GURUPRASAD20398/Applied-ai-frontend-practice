import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services';
import { parseError } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import OrderCard from '../components/orders/OrderCard';
import Loader from '../components/common/Loader';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    orderService
      .list()
      .then((d) => setOrders(d.items))
      .catch(() => setError('Unable to load your orders.'));
  }, []);

  // Buy Again: rebuild the cart from the order, then go to the cart.
  const buyAgain = async (order) => {
    setBusyId(order.id);
    try {
      const { skipped } = await cart.rebuy(order.id);
      if (skipped?.length) toast.info(`Unavailable and skipped: ${skipped.join(', ')}`);
      else toast.success('Items added to your cart');
      navigate('/cart');
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <p role="alert" className="py-10 text-center text-danger">{error}</p>;
  if (!orders) return <Loader label="Loading your orders..." />;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Orders' }]} />
      <h1 className="text-xl font-normal text-white">Order history</h1>
      {orders.length === 0 ? (
        <div className="mt-4 bg-layer p-10 text-center">
          <p className="text-lg text-muted">You haven&apos;t placed any orders yet.</p>
          <Link to="/books" className="btn-primary mt-4">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onBuyAgain={buyAgain} busy={busyId === o.id} />
          ))}
        </div>
      )}
    </div>
  );
}
