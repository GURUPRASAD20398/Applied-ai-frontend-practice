import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY = { items: [], summary: { quantity: 0, subtotal: 0, tax: 0, total: 0 } };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const apply = (data) => {
    setState({ items: data.items, summary: data.summary });
    return data;
  };

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return setState(EMPTY);
    setLoading(true);
    try {
      apply(await cartService.get());
    } catch {
      setState(EMPTY);
    } finally {
      setLoading(false);
    }
    return undefined;
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      items: state.items,
      activeItems: state.items.filter((i) => !i.savedForLater),
      savedItems: state.items.filter((i) => i.savedForLater),
      summary: state.summary,
      count: state.summary.quantity,
      loading,
      refresh,
      add: async (bookId, qty) => apply(await cartService.add(bookId, qty)),
      updateQuantity: async (id, quantity) => apply(await cartService.update(id, { quantity })),
      setSavedForLater: async (id, savedForLater) => apply(await cartService.update(id, { savedForLater })),
      remove: async (id) => apply(await cartService.remove(id)),
      clear: async () => apply(await cartService.clear()),
      rebuy: async (orderId) => apply(await cartService.rebuy(orderId)),
    }),
    [state, loading, refresh]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
