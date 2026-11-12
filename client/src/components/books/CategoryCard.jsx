import { Link } from 'react-router-dom';

/** One entry of the vertical category list shown beside the catalog. Pure navigation (no data changes). */
export default function CategoryCard({ category, active = false }) {
  return (
    <Link
      to={`/books?category=${encodeURIComponent(category.name)}`}
      aria-current={active ? 'true' : undefined}
      className={`flex items-center justify-between px-4 py-2 text-xs transition-colors ${
        active ? 'bg-layer-2 text-white shadow-[inset_3px_0_0_#0f62fe]' : 'text-ink hover:bg-layer'
      }`}
    >
      <span>{category.name}</span>
      {category.bookCount !== undefined && <span className="text-subtle">{category.bookCount}</span>}
    </Link>
  );
}
