import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addressService, orderService } from '../services';
import { parseError } from '../services/api';
import { useToast } from '../context/ToastContext';
import AddressCard from '../components/checkout/AddressCard';
import AddressForm from '../components/checkout/AddressForm';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { ArrowRightIcon } from '../components/common/Icons';
import { OrderSummary } from './CartPage';
import { formatPrice } from '../utils/format';

export default function CheckoutPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [points, setPoints] = useState('');
  const [preview, setPreview] = useState(null);
  const [pointsError, setPointsError] = useState('');

  const loadAddresses = useCallback(async () => {
    const { items } = await addressService.list();
    setAddresses(items);
    setSelectedId((cur) => (items.some((a) => a.id === cur) ? cur : (items.find((a) => a.isDefault) || items[0])?.id ?? null));
    return items;
  }, []);

  useEffect(() => {
    loadAddresses().catch(() => toast.error('Unable to load addresses'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAddresses]);

  const refreshPreview = useCallback(async (pts) => {
    try {
      setPreview(await orderService.preview(pts));
      setPointsError('');
      return true;
    } catch (e) {
      const msg = parseError(e).message;
      if (/cart is empty/i.test(msg)) navigate('/cart', { replace: true });
      else setPointsError(msg);
      return false;
    }
  }, [navigate]);

  useEffect(() => {
    refreshPreview(0);
  }, [refreshPreview]);

  const applyPoints = async () => {
    const n = Math.floor(Number(points) || 0);
    if (n < 0) return setPointsError('Enter a valid number of points');
    await refreshPreview(n);
    return undefined;
  };

  const saveAddress = async (data) => {
    setSaving(true);
    setFormErrors({});
    try {
      if (editing && editing !== 'new') await addressService.update(editing.id, data);
      else await addressService.create(data);
      await loadAddresses();
      setEditing(null);
      toast.success('Address saved');
    } catch (e) {
      const { message, fields } = parseError(e);
      setFormErrors(fields);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (a) => {
    try {
      setAddresses((await addressService.setDefault(a.id)).items);
    } catch (e) {
      toast.error(parseError(e).message);
    }
  };

  const confirmDelete = async () => {
    try {
      await addressService.remove(deleting.id);
      await loadAddresses();
      toast.success('Address deleted');
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setDeleting(null);
    }
  };

  const proceed = () => {
    if (!selectedId) return toast.error('Please select or add a delivery address');
    navigate('/payment', { state: { addressId: selectedId, pointsToRedeem: preview?.pointsRedeemed || 0 } });
    return undefined;
  };

  if (!addresses || !preview) return <Loader label="Preparing checkout..." />;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="text-xl font-normal text-white">Checkout</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_minmax(320px,440px)]">
        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="addr-h">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="addr-h" className="text-base font-normal text-white">1. Delivery address</h2>
              <button type="button" className="btn-outline" onClick={() => { setFormErrors({}); setEditing('new'); }}>+ Add address</button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted">You have no saved addresses. Add one to continue.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="addr-h">
                {addresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    address={a}
                    selected={a.id === selectedId}
                    onSelect={setSelectedId}
                    onEdit={(x) => { setFormErrors({}); setEditing(x); }}
                    onDelete={setDeleting}
                    onMakeDefault={makeDefault}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="card p-5" aria-labelledby="pts-h">
            <h2 id="pts-h" className="text-base font-normal text-white">2. Reward points</h2>
            <p className="mt-1 text-sm text-muted">
              Balance: <strong data-testid="points-balance">{preview.pointsBalance}</strong> points (1 point = {formatPrice(1)}).
              You will earn <strong>{preview.pointsToEarn}</strong> points on this order.
            </p>
            <div className="mt-3 flex flex-wrap items-start gap-2">
              <div>
                <label htmlFor="points" className="sr-only">Points to redeem</label>
                <input id="points" type="number" min="0" inputMode="numeric" className={`input w-40 ${pointsError ? 'input-error' : ''}`} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Points to redeem" aria-invalid={!!pointsError} aria-describedby={pointsError ? 'points-error' : undefined} />
              </div>
              <button type="button" className="btn-primary" onClick={applyPoints}>Redeem</button>
              {preview.pointsRedeemed > 0 && (
                <button type="button" className="btn-outline" onClick={() => { setPoints(''); refreshPreview(0); }}>Remove</button>
              )}
            </div>
            {pointsError && <p id="points-error" role="alert" className="mt-2 text-sm text-danger">{pointsError}</p>}
            {preview.pointsRedeemed > 0 && !pointsError && (
              <p role="status" className="mt-2 text-sm text-success">{preview.pointsRedeemed} points applied. You save {formatPrice(preview.discount)}.</p>
            )}
          </section>

          <section className="card p-5" aria-labelledby="rev-h">
            <h2 id="rev-h" className="text-base font-normal text-white">3. Review items</h2>
            <ul className="mt-3 divide-y divide-layer-2">
              {preview.items.map((i) => (
                <li key={i.bookId} className="flex items-center gap-3 py-3 text-sm">
                  <img src={i.image} alt="" className="h-16 w-11 object-cover" />
                  <span className="flex-1 text-ink">{i.title}</span>
                  <span className="text-muted">&times; {i.quantity}</span>
                  <span className="font-semibold text-white">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <Link to="/cart" className="mt-2 inline-block text-sm text-link hover:underline">Edit cart</Link>
          </section>
        </div>

        <OrderSummary summary={preview}>
          <button type="button" className="btn-primary mt-5 w-full justify-between" onClick={proceed}>
            Continue to payment
            <ArrowRightIcon />
          </button>
        </OrderSummary>
      </div>

      <Modal open={!!editing} title={editing && editing !== 'new' ? 'Edit address' : 'Add address'} onClose={() => setEditing(null)}>
        {editing && (
          <AddressForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            onSubmit={saveAddress}
            onCancel={() => setEditing(null)}
            serverErrors={formErrors}
            submitting={saving}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        title="Delete address?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" className="btn-danger" onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm text-muted">This will permanently remove the address for {deleting?.fullName}.</p>
      </Modal>
    </div>
  );
}
