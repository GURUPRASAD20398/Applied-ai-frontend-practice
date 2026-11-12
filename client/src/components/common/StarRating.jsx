import { StarIcon } from './Icons';

export default function StarRating({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-xs" aria-label={`Rated ${value} out of 5`}>
      <span aria-hidden="true" className="inline-flex gap-0.5 text-accent">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={n <= full} className={n <= full ? '' : 'text-layer-3'} />
        ))}
      </span>
      <span className="text-muted">{Number(value).toFixed(1)}</span>
      {count !== undefined && <span className="text-subtle">({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}
