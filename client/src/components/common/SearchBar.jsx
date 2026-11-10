import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ initial = '', className = '' }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/books?search=${encodeURIComponent(term)}` : '/books');
  };

  return (
    <form role="search" onSubmit={submit} className={`flex w-full ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        Search books, authors or ISBN
      </label>
      <input
        id="site-search"
        type="search"
        value={q}
        maxLength={100}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search books, authors, ISBN..."
        className="w-full rounded-l-lg border-0 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button type="submit" className="rounded-r-lg bg-accent px-4 text-sm font-semibold text-slate-900 hover:bg-accent-dark hover:text-white" aria-label="Search">
        Search
      </button>
    </form>
  );
}
