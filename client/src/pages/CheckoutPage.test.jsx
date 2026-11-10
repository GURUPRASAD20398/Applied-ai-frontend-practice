import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';
import { renderWithProviders, sampleBook, seedSession } from '../test/utils';
import { addressService, orderService, cartService, wishlistService } from '../services';

jest.mock('../services', () => ({
  addressService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), setDefault: jest.fn(), remove: jest.fn() },
  orderService: { preview: jest.fn() },
  cartService: { get: jest.fn() },
  wishlistService: { get: jest.fn() },
}));
jest.mock('../services/authService', () => require('../test/authServiceMock'));

const addr = (id, over = {}) => ({
  id, fullName: `Person ${id}`, phone: '9876543210', houseNumber: '1', street: 'Main Street', city: 'Pune',
  state: 'MH', country: 'India', pincode: '411001', isDefault: id === 1, ...over,
});
const preview = (over = {}) => ({
  items: [{ bookId: 1, title: 'Alpha Book', price: 300, quantity: 1, image: '/c.svg' }],
  quantity: 1, subtotal: 300, tax: 15, total: 315, pointsRedeemed: 0, discount: 0, payable: 315, pointsBalance: 500, pointsToEarn: 3, ...over,
});

function PaymentSpy() {
  // eslint-disable-next-line global-require
  const { useLocation } = require('react-router-dom');
  const { state } = useLocation();
  return <output data-testid="pay-state">{JSON.stringify(state)}</output>;
}

const renderCheckout = () =>
  renderWithProviders(
    <Routes>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment" element={<PaymentSpy />} />
      <Route path="/cart" element={<p>Cart page</p>} />
    </Routes>,
    { route: '/checkout' }
  );

beforeEach(() => {
  jest.clearAllMocks();
  seedSession();
  cartService.get.mockResolvedValue({ items: [], summary: { quantity: 0, subtotal: 0, tax: 0, total: 0 } });
  wishlistService.get.mockResolvedValue({ items: [] });
  addressService.list.mockResolvedValue({ items: [addr(1), addr(2)] });
  orderService.preview.mockResolvedValue(preview());
});

describe('CheckoutPage', () => {
  test('lists addresses with the default pre-selected', async () => {
    renderCheckout();
    expect(await screen.findByText('Person 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Deliver to Person 1')).toBeChecked();
    expect(screen.getByLabelText('Deliver to Person 2')).not.toBeChecked();
    expect(screen.getByTestId('points-balance')).toHaveTextContent('500');
  });

  test('validates the address form before saving', async () => {
    renderCheckout();
    await userEvent.click(await screen.findByRole('button', { name: '+ Add address' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add address' });
    await userEvent.type(within(dialog).getByLabelText('Phone'), '123');
    await userEvent.type(within(dialog).getByLabelText('Pincode'), '12');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save address' }));

    expect(await within(dialog).findByText('Enter a valid 10-digit mobile number')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a valid 6-digit pincode')).toBeInTheDocument();
    expect(within(dialog).getByText('Full name is required')).toBeInTheDocument();
    expect(addressService.create).not.toHaveBeenCalled();
  });

  test('adds a new address', async () => {
    const after = [addr(1), addr(2), addr(3, { fullName: 'Ravi Kumar' })];
    addressService.create.mockResolvedValue({ items: after });
    addressService.list.mockResolvedValueOnce({ items: [addr(1), addr(2)] }).mockResolvedValue({ items: after });
    renderCheckout();
    await userEvent.click(await screen.findByRole('button', { name: '+ Add address' }));
    const dialog = await screen.findByRole('dialog');
    const type = (label, v) => userEvent.type(within(dialog).getByLabelText(label), v);
    await type('Full name', 'Ravi Kumar');
    await type('Phone', '9123456780');
    await type('House number', '12');
    await type('Street', 'Brigade Road');
    await type('City', 'Bengaluru');
    await type('State', 'Karnataka');
    await type('Pincode', '560025');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save address' }));

    await waitFor(() => expect(addressService.create).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Ravi Kumar', country: 'India', pincode: '560025' })));
    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument();
  });

  test('deletes an address after confirmation', async () => {
    addressService.remove.mockResolvedValue({});
    renderCheckout();
    await screen.findByText('Person 2');
    addressService.list.mockResolvedValue({ items: [addr(1)] });
    const card = screen.getByText('Person 2').closest('div.rounded-xl');
    await userEvent.click(within(card).getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Delete address?' })).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(addressService.remove).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByText('Person 2')).not.toBeInTheDocument());
  });

  test('sets another address as default', async () => {
    addressService.setDefault.mockResolvedValue({ items: [addr(1, { isDefault: false }), addr(2, { isDefault: true })] });
    renderCheckout();
    const card = (await screen.findByText('Person 2')).closest('div.rounded-xl');
    await userEvent.click(within(card).getByRole('button', { name: 'Set as default' }));
    expect(addressService.setDefault).toHaveBeenCalledWith(2);
    await waitFor(() => expect(within(screen.getByText('Person 2').closest('div.rounded-xl')).getByText('Default')).toBeInTheDocument());
  });

  test('redeems reward points and updates the total', async () => {
    renderCheckout();
    await screen.findByText('Person 1');
    orderService.preview.mockResolvedValue(preview({ pointsRedeemed: 100, discount: 100, payable: 215, pointsToEarn: 2 }));
    await userEvent.type(screen.getByLabelText('Points to redeem'), '100');
    await userEvent.click(screen.getByRole('button', { name: 'Redeem' }));
    expect(orderService.preview).toHaveBeenLastCalledWith(100);
    expect(await screen.findByRole('status')).toHaveTextContent('100 points applied');
    expect(screen.getByTestId('summary-total')).toHaveTextContent('215.00');
  });

  test('shows an error when redeeming more points than available', async () => {
    renderCheckout();
    await screen.findByText('Person 1');
    orderService.preview.mockRejectedValue({ response: { data: { error: 'Not enough reward points' } } });
    await userEvent.type(screen.getByLabelText('Points to redeem'), '99999');
    await userEvent.click(screen.getByRole('button', { name: 'Redeem' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Not enough reward points');
  });

  test('continues to payment with the selected address and points', async () => {
    renderCheckout();
    await screen.findByText('Person 1');
    await userEvent.click(screen.getByLabelText('Deliver to Person 2'));
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(JSON.parse((await screen.findByTestId('pay-state')).textContent)).toEqual({ addressId: 2, pointsToRedeem: 0 });
  });

  test('redirects to the cart when it is empty', async () => {
    orderService.preview.mockRejectedValue({ response: { data: { error: 'Your cart is empty' } } });
    renderCheckout();
    expect(await screen.findByText('Cart page')).toBeInTheDocument();
  });
});
