export default function Loader({ label = 'Loading...', fullPage = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-12 text-muted ${fullPage ? 'min-h-[60vh]' : ''}`}
    >
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-layer-2 border-t-primary" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
