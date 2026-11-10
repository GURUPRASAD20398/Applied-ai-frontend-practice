export default function StarRating({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value} out of 5`}>
      <span aria-hidden="true" className="tracking-tight text-accent">
        {'★'.repeat(full)}
        <span className="text-slate-300">{'★'.repeat(5 - full)}</span>
      </span>
      <span className="font-medium text-slate-700">{Number(value).toFixed(1)}</span>
      {count !== undefined && <span className="text-slate-500">({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}
