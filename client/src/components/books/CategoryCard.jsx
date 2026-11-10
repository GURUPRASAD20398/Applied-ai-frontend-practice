import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/books?category=${encodeURIComponent(category.name)}`}
      className="group flex flex-col justify-between rounded-xl p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: category.color }}
    >
      <span className="text-lg font-bold leading-tight">{category.name}</span>
      <span className="mt-6 text-xs opacity-90">
        {category.bookCount ?? 0} books <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}
