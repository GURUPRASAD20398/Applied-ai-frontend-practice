import { useState } from 'react';

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-slate-200 py-4 first:pt-0 last:border-0">
      <legend className="mb-2 text-sm font-bold text-secondary">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckList({ name, options, selected, onToggle, max = 6 }) {
  const [all, setAll] = useState(false);
  const shown = all ? options : options.slice(0, max);
  return (
    <>
      <ul className="space-y-1.5">
        {shown.map((o) => (
          <li key={o}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-primary" name={name} checked={selected.includes(o)} onChange={() => onToggle(o)} />
              {o}
            </label>
          </li>
        ))}
      </ul>
      {options.length > max && (
        <button type="button" className="mt-2 text-xs font-semibold text-primary hover:underline" onClick={() => setAll((v) => !v)}>
          {all ? 'Show less' : `Show all (${options.length})`}
        </button>
      )}
    </>
  );
}

/** Controlled filter panel. `filters` is a flat object parsed from the URL by the catalog page. */
export default function FilterSidebar({ facets, filters, onChange, onReset }) {
  const toggle = (key) => (value) => {
    const cur = filters[key];
    onChange({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };

  return (
    <aside aria-label="Filters" className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-secondary">Filters</h2>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-primary hover:underline">
          Clear all
        </button>
      </div>

      <Group title="Category">
        <CheckList name="category" options={facets.categories.map((c) => c.name)} selected={filters.category} onToggle={toggle('category')} />
      </Group>
      <Group title="Author">
        <CheckList name="author" options={facets.authors} selected={filters.author} onToggle={toggle('author')} max={5} />
      </Group>
      <Group title="Publisher">
        <CheckList name="publisher" options={facets.publishers} selected={filters.publisher} onToggle={toggle('publisher')} />
      </Group>

      <Group title="Rating">
        <label htmlFor="filter-rating" className="sr-only">
          Minimum rating
        </label>
        <select id="filter-rating" className="input" value={filters.rating} onChange={(e) => onChange({ rating: e.target.value })}>
          <option value="">Any rating</option>
          {[4.5, 4, 3.5, 3].map((r) => (
            <option key={r} value={r}>
              {r} &amp; up
            </option>
          ))}
        </select>
      </Group>

      <Group title="Price range (₹)">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="min-price">Minimum price</label>
          <input id="min-price" type="number" min="0" inputMode="numeric" placeholder={String(facets.priceRange.min)} className="input" value={filters.minPrice} onChange={(e) => onChange({ minPrice: e.target.value })} />
          <span aria-hidden="true">-</span>
          <label className="sr-only" htmlFor="max-price">Maximum price</label>
          <input id="max-price" type="number" min="0" inputMode="numeric" placeholder={String(facets.priceRange.max)} className="input" value={filters.maxPrice} onChange={(e) => onChange({ maxPrice: e.target.value })} />
        </div>
      </Group>
    </aside>
  );
}
