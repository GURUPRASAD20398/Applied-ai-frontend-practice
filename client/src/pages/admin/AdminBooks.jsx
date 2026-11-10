import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { adminService, bookService } from '../../services';
import { parseError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { bookSchema } from '../../utils/validators';
import { formatPrice } from '../../utils/format';
import FormField from '../../components/common/FormField';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';

function BookForm({ initial, categories, onSubmit, onCancel, saving, serverErrors }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(bookSchema),
    defaultValues: initial || { title: '', author: '', publisher: '', categoryId: '', price: '', stock: '', isbn: '', description: '' },
  });
  const err = (n) => errors[n]?.message || serverErrors[n];
  const cls = (n) => `input ${err(n) ? 'input-error' : ''}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><FormField label="Title" id="b-title" error={err('title')}><input id="b-title" className={cls('title')} {...register('title')} /></FormField></div>
      <FormField label="Author" id="b-author" error={err('author')}><input id="b-author" className={cls('author')} {...register('author')} /></FormField>
      <FormField label="Publisher" id="b-publisher" error={err('publisher')}><input id="b-publisher" className={cls('publisher')} {...register('publisher')} /></FormField>
      <FormField label="Category" id="b-category" error={err('categoryId')}>
        <select id="b-category" className={cls('categoryId')} {...register('categoryId')}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </FormField>
      <FormField label="ISBN" id="b-isbn" error={err('isbn')}><input id="b-isbn" className={cls('isbn')} {...register('isbn')} /></FormField>
      <FormField label="Price (₹)" id="b-price" error={err('price')}><input id="b-price" type="number" step="0.01" className={cls('price')} {...register('price')} /></FormField>
      <FormField label="Stock" id="b-stock" error={err('stock')}><input id="b-stock" type="number" className={cls('stock')} {...register('stock')} /></FormField>
      <div className="sm:col-span-2"><FormField label="Description" id="b-desc" error={err('description')}><textarea id="b-desc" rows={3} className={cls('description')} {...register('description')} /></FormField></div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save book'}</button>
      </div>
    </form>
  );
}

export default function AdminBooks() {
  const toast = useToast();
  const [books, setBooks] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | book
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const load = useCallback(async () => setBooks((await adminService.books()).items), []);

  useEffect(() => {
    load().catch(() => toast.error('Unable to load books'));
    bookService.categories().then((d) => setCategories(d.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const save = async (data) => {
    setSaving(true);
    setServerErrors({});
    try {
      if (editing === 'new') await adminService.createBook(data);
      else await adminService.updateBook(editing.id, data);
      await load();
      setEditing(null);
      toast.success('Book saved');
    } catch (e) {
      const { message, fields } = parseError(e);
      setServerErrors(fields);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminService.deleteBook(deleting.id);
      await load();
      toast.success('Book deleted');
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setDeleting(null);
    }
  };

  if (!books) return <Loader label="Loading books..." />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-secondary">Book management</h1>
        <div className="flex gap-2">
          <Link to="/admin" className="btn-outline">Dashboard</Link>
          <button type="button" className="btn-primary" onClick={() => { setServerErrors({}); setEditing('new'); }}>+ Add book</button>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">All books</caption>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">Author</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Stock</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {books.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-secondary">{b.title}</td>
                <td className="px-4 py-3">{b.author}</td>
                <td className="px-4 py-3">{b.category}</td>
                <td className="px-4 py-3">{formatPrice(b.price)}</td>
                <td className="px-4 py-3">{b.stock}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button type="button" className="mr-3 font-semibold text-primary hover:underline" onClick={() => { setServerErrors({}); setEditing(b); }} aria-label={`Edit ${b.title}`}>Edit</button>
                  <button type="button" className="font-semibold text-red-600 hover:underline" onClick={() => setDeleting(b)} aria-label={`Delete ${b.title}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} title={editing === 'new' ? 'Add book' : 'Edit book'} onClose={() => setEditing(null)}>
        {editing && (
          <BookForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            categories={categories}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            saving={saving}
            serverErrors={serverErrors}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        title="Delete book?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" className="btn-danger" onClick={remove}>Delete</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">&ldquo;{deleting?.title}&rdquo; will be permanently removed from the catalog.</p>
      </Modal>
    </div>
  );
}
