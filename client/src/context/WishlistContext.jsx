import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { wishlistService } from '../services';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return setItems([]);
    try {
      setItems((await wishlistService.get()).items);
    } catch {
      setItems([]);
    }
    return undefined;
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      items,
      has: (bookId) => items.some((i) => i.bookId === bookId),
      add: async (bookId) => setItems((await wishlistService.add(bookId)).items),
      remove: async (bookId) => setItems((await wishlistService.remove(bookId)).items),
      moveToCart: async (bookId) => setItems((await wishlistService.moveToCart(bookId)).items),
      refresh,
    }),
    [items, refresh]
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
