import BookCard from './BookCard';

export default function BookGrid({ books, columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', emptyMessage = 'No books found.' }) {
  if (!books.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{emptyMessage}</p>;
  }
  return (
    <div className={`grid gap-4 ${columns}`}>
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
