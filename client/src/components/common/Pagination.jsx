function range(page, total) {
  const pages = new Set([1, total, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap-' + p);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      <button type="button" className="btn-outline" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {range(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="px-1 text-subtle" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`h-10 min-w-10 px-2 text-sm ${p === page ? 'bg-primary text-white' : 'bg-layer text-ink hover:bg-layer-2'}`}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className="btn-outline" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
