import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { orderService, paymentService } from '../services';
import { parseError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { paymentSchema } from '../utils/validators';
import { PAYMENT_LABELS, formatPrice } from '../utils/format';
import FormField from '../components/common/FormField';
import { CardIcon } from '../components/common/Icons';

const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank'];
const WALLETS = ['PayWallet', 'QuickPay', 'MobiCash'];
const METHODS = Object.keys(PAYMENT_LABELS);

/** Formats card input as "1234 5678 9012 3456". */
const formatCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function PaymentForm({ method, onPay, paying, amount }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(paymentSchema(method)), defaultValues: { method } });
  const isCard = method === 'credit_card' || method === 'debit_card';
  const err = (n) => errors[n]?.message;
  const cls = (n) => `input ${errors[n] ? 'input-error' : ''}`;

  return (
    <form onSubmit={handleSubmit(onPay)} noValidate className="space-y-4">
      {isCard && (
        <>
          <FormField label="Name on card" id="cardName" error={err('cardName')}>
            <input id="cardName" autoComplete="cc-name" className={cls('cardName')} aria-invalid={!!errors.cardName} {...register('cardName')} />
          </FormField>
          <FormField label="Card number" id="cardNumber" error={err('cardNumber')} hint="Test: 4242 4242 4242 4242 (4000 0000 0000 0002 is declined)">
            <input
              id="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              className={cls('cardNumber')}
              aria-invalid={!!errors.cardNumber}
              {...register('cardNumber', { onChange: (e) => setValue('cardNumber', formatCard(e.target.value)) })}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Expiry (MM/YY)" id="expiry" error={err('expiry')}>
              <input
                id="expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                className={cls('expiry')}
                aria-invalid={!!errors.expiry}
                {...register('expiry', { onChange: (e) => setValue('expiry', formatExpiry(e.target.value)) })}
              />
            </FormField>
            <FormField label="CVV" id="cvv" error={err('cvv')}>
              <input id="cvv" type="password" inputMode="numeric" maxLength={4} autoComplete="cc-csc" className={cls('cvv')} aria-invalid={!!errors.cvv} {...register('cvv')} />
            </FormField>
          </div>
        </>
      )}
      {method === 'upi' && (
        <FormField label="UPI ID" id="upiId" error={err('upiId')}>
          <input id="upiId" placeholder="name@bank" className={cls('upiId')} aria-invalid={!!errors.upiId} {...register('upiId')} />
        </FormField>
      )}
      {method === 'net_banking' && (
        <FormField label="Select bank" id="bank" error={err('bank')}>
          <select id="bank" className={cls('bank')} {...register('bank')}>
            <option value="">Choose your bank</option>
            {BANKS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </FormField>
      )}
      {method === 'wallet' && (
        <FormField label="Select wallet" id="wallet" error={err('wallet')}>
          <select id="wallet" className={cls('wallet')} {...register('wallet')}>
            <option value="">Choose a wallet</option>
            {WALLETS.map((w) => <option key={w}>{w}</option>)}
          </select>
        </FormField>
      )}
      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary min-w-40 justify-between" disabled={paying}>
          {paying ? 'Processing payment...' : `Pay ${formatPrice(amount)}`}
          <CardIcon />
        </button>
      </div>
      <p className="text-xs text-subtle">This is a simulated payment. No real money is charged.</p>
    </form>
  );
}

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUser } = useAuth();
  const cart = useCart();
  const [method, setMethod] = useState('credit_card');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  if (!state?.addressId) return <Navigate to="/checkout" replace />;
  const { addressId, pointsToRedeem } = state;

  const amountPreview = Math.max(0, cart.summary.total - (pointsToRedeem || 0));

  const onPay = async ({ method: _m, ...details }) => {
    setPaying(true);
    setError('');
    try {
      const payment = await paymentService.pay({ method, details, pointsToRedeem });
      const { order } = await orderService.place({ addressId, paymentId: payment.paymentId, pointsToRedeem });
      await Promise.all([cart.refresh(), refreshUser()]);
      toast.success('Payment successful!');
      navigate(`/order-success/${order.id}`, { replace: true, state: { fresh: true } });
    } catch (e) {
      const { message } = parseError(e);
      setError(message);
      toast.error(message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="w-full max-w-2xl bg-layer text-ink" aria-labelledby="pay-h">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <h1 id="pay-h" className="text-base font-normal text-white">Complete Payment</h1>
        <p className="text-sm font-semibold text-white">Payable Amount: {formatPrice(amountPreview)}</p>
      </header>
      <div className="grid sm:grid-cols-[170px_1fr]">
        <fieldset className="border-b border-line sm:border-b-0 sm:border-r">
          <legend className="sr-only">Choose a payment method</legend>
          <div className="flex overflow-x-auto sm:block sm:overflow-visible" role="radiogroup">
            {METHODS.map((m) => (
              <label
                key={m}
                className={`block flex-1 cursor-pointer whitespace-nowrap px-4 py-4 text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-white ${
                  method === m ? 'bg-layer text-white shadow-[inset_3px_0_0_#0f62fe]' : 'bg-layer-2 text-muted hover:bg-layer-3'
                }`}
              >
                <input type="radio" name="method" value={m} checked={method === m} onChange={() => { setMethod(m); setError(''); }} className="sr-only" />
                {PAYMENT_LABELS[m]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="p-5">
          {error && <div role="alert" className="mb-4 border-l-4 border-danger bg-layer-2 px-3 py-2 text-sm text-ink">{error}</div>}
          <PaymentForm key={method} method={method} onPay={onPay} paying={paying} amount={amountPreview} />
        </div>
      </div>
    </section>
  );
}
