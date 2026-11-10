import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services';
import { formatPrice } from '../../utils/format';
import Loader from '../../components/common/Loader';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.stats().then(setStats).catch(() => setError('Unable to load statistics.'));
  }, []);

  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!stats) return <Loader label="Loading dashboard..." />;

  const cards = [
    ['Total books', stats.totalBooks],
    ['Total orders', stats.totalOrders],
    ['Total users', stats.totalUsers],
    ['Revenue', formatPrice(stats.revenue)],
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary">Admin dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-primary" data-testid={`stat-${label}`}>{value}</p>
          </div>
        ))}
      </div>
      <Link to="/admin/books" className="btn-primary mt-6">Manage books</Link>
    </div>
  );
}
