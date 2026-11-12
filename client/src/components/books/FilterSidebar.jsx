import { useState } from 'react';

function Group({ title, children }) {
  return (
    <fieldset className="border-t border-line py-4">
      <legend className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-subtle">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Vertical list row. The checkbox is visually hidden; the row itself is the visible control. */
function ListRow({ name, label, checked, onToggle }) {
  return (
    <li>
      <label
        className={`flex cursor-pointer items-center px-4 py-2 text-xs transition-colors focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-white ${
          checked ? 'bg-layer-2 text-white shadow-[inset_3px_0_0_#0f62fe]' : 'text-ink hover:bg-layer'
        }`}
      >
        <input type="checkbox" className="sr-only" name={name} checked={checked} onChange={onToggle} />
        {label}
      </label>
    </li>
  );
}

function CheckList({ name, options, selected, onToggle, max = 6 }) {
  const [all, setAll] = useState(false);
  const shown = all ? options : options.slice(0, max);
  return (
    <>
      <ul>
        {shown.map((o) => (
          <ListRow key={o} name={name} label={o} checked={selected.includes(o)} onToggle={() => onToggle(o)} />
        ))}
      </ul>
      {options.length > max && (
        <button type="button" className="mt-1 px-4 text-xs text-link hover:underline" onClick={() => setAll((v) => !v)}>
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
    <aside aria-label="Filters" className="bg-canvas">
      <ul>
        <li>
          <button
            type="button"
            onClick={onReset}
            className={`block w-full px-4 py-2 text-left text-xs transition-colors ${
              filters.category.length === 0 ? 'bg-layer-2 text-white shadow-[inset_3px_0_0_#0f62fe]' : 'text-ink hover:bg-layer'
            }`}
            aria-label="Clear all filters"
          >
            All
          </button>
        </li>
      </ul>
      <ul>
        {facets.categories.map((c) => (
          <ListRow
            key={c.id ?? c.name}
            name="category"
            label={c.name}
            checked={filters.category.includes(c.name)}
            onToggle={() => toggle('category')(c.name)}
          />
        ))}
      </ul>

      <Group title="Author">
        <CheckList name="author" options={facets.authors} selected={filters.author} onToggle={toggle('author')} max={5} />
      </Group>
      <Group title="Publisher">
        <CheckList name="publisher" options={facets.publishers} selected={filters.publisher} onToggle={toggle('publisher')} />
      </Group>
    </aside>
  );
}

/** Rating and price controls, laid out in the catalog's filter bar. */
export function FilterBarFields({ facets, filters, onChange }) {
  return (
    <>
      <div>
        <label htmlFor="filter-rating" className="mb-1 block text-xs text-muted">
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
      </div>
      <div>
        <span className="mb-1 block text-xs text-muted" id="price-range-label">
          Price Range (₹)
        </span>
        <div className="flex items-center gap-2" role="group" aria-labelledby="price-range-label">
          <label className="sr-only" htmlFor="min-price">Minimum price</label>
          <input
            id="min-price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder={facets ? String(facets.priceRange.min) : 'Min'}
            className="input min-w-0"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <span aria-hidden="true" className="text-subtle">-</span>
          <label className="sr-only" htmlFor="max-price">Maximum price</label>
          <input
            id="max-price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder={facets ? String(facets.priceRange.max) : 'Max'}
            className="input min-w-0"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}
