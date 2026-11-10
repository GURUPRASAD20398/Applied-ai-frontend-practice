import { PAYMENT_LABELS, formatDate, formatPrice } from './format';

/** Builds a plain-text receipt for an order. */
export function buildReceipt(order) {
  const a = order.address;
  const lines = [
    'PAGETURNER - PAYMENT RECEIPT',
    '='.repeat(44),
    `Order ID : ${order.orderNumber}`,
    `Date     : ${formatDate(order.createdAt)}`,
    `Payment  : ${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}`,
    '',
    'ITEMS',
    '-'.repeat(44),
    ...order.items.map((i) => `${i.title}\n   ${i.quantity} x ${formatPrice(i.price)} = ${formatPrice(i.quantity * i.price)}`),
    '-'.repeat(44),
    `Subtotal : ${formatPrice(order.subtotal)}`,
    `Tax      : ${formatPrice(order.tax)}`,
    ...(order.discount > 0 ? [`Rewards  : -${formatPrice(order.discount)} (${order.pointsRedeemed} pts)`] : []),
    `TOTAL    : ${formatPrice(order.total)}`,
    '',
    'DELIVERY ADDRESS',
    `${a.fullName}, ${a.phone}`,
    `${a.houseNumber}, ${a.street}`,
    `${a.city}, ${a.state}, ${a.country} - ${a.pincode}`,
    '',
    'Thank you for shopping with PageTurner!',
  ];
  return lines.join('\n');
}

export function downloadReceipt(order) {
  const blob = new Blob([buildReceipt(order)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${order.orderNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
