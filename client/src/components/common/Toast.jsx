import { useToast } from '../../context/ToastContext';

const STYLES = {
  success: 'border-success bg-layer text-ink',
  error: 'border-danger bg-layer text-ink',
  info: 'border-primary bg-layer text-ink',
};

export default function Toast() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-4 px-4 py-3 text-sm shadow-lg ${STYLES[t.type]}`}
        >
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="font-bold leading-none text-muted hover:text-white">
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
