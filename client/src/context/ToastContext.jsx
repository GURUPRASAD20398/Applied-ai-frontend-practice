import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (type, message, ms = 4000) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      success: (m) => notify('success', m),
      error: (m) => notify('error', m, 6000),
      info: (m) => notify('info', m),
    }),
    [toasts, dismiss, notify]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
