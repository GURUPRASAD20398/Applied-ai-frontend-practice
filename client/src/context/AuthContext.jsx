import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Seed from the cached session so the UI doesn't flash logged-out, then validate with the API.
  const [user, setUser] = useState(authService.cachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService.currentUser().then((u) => {
      if (active) {
        setUser(u);
        setLoading(false);
      }
    });
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => {
      active = false;
      window.removeEventListener('auth:expired', onExpired);
    };
  }, []);

  const login = useCallback(async (email, password, remember) => {
    const u = await authService.login(email, password, remember);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authService.currentUser();
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, isAdmin: user?.role === 'admin', login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
