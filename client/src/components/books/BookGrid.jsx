import BookCard from './BookCard';

export default function BookGrid({ books, columns = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3', emptyMessage = 'No books found.' }) {
  if (!books.length) {
    return <p className="border border-dashed border-layer-3 bg-layer p-10 text-center text-muted">{emptyMessage}</p>;
  }
  return (
    <div className={`grid gap-x-8 gap-y-8 ${columns}`}>
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
