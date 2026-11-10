import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services';
import { parseError } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import OrderCard from '../components/orders/OrderCard';
import Loader from '../components/common/Loader';

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

  if (error) return <p role="alert" className="py-10 text-center text-red-700">{error}</p>;
  if (!orders) return <Loader label="Loading your orders..." />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">Order history</h1>
      {orders.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-lg text-slate-600">You haven&apos;t placed any orders yet.</p>
          <Link to="/books" className="btn-primary mt-4">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onBuyAgain={buyAgain} busy={busyId === o.id} />
          ))}
        </div>
      )}
    </div>
  );
}
