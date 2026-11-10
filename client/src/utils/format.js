const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export const formatPrice = (n) => inr.format(Number(n) || 0);

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const formatLongDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

export const PAYMENT_LABELS = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  net_banking: 'Net Banking',
  wallet: 'Wallet',
};
