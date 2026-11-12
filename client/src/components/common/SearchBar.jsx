import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from './Icons';

export default function SearchBar({ initial = '', className = '' }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/books?search=${encodeURIComponent(term)}` : '/books');
  };

  return (
    <form role="search" onSubmit={submit} className={`relative flex w-full ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        Search books, authors or ISBN
      </label>
      <input
        id="site-search"
        type="search"
        value={q}
        maxLength={100}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        className="input h-9 py-0 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      <button type="submit" className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted hover:text-white" aria-label="Search">
        <SearchIcon />
      </button>
    </form>
  );
}
