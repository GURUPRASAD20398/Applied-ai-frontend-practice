import { useToast } from '../../context/ToastContext';

const STYLES = {
  success: 'border-green-600 bg-green-50 text-green-900',
  error: 'border-red-600 bg-red-50 text-red-900',
  info: 'border-primary bg-primary-light text-slate-900',
};

export default function Toast() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-4 px-4 py-3 text-sm shadow-lg ${STYLES[t.type]}`}
        >
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="font-bold leading-none">
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
