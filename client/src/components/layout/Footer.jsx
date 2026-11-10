import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 bg-secondary text-slate-300">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold text-white">
            Page<span className="text-accent">Turner</span>
          </p>
          <p className="mt-2 text-sm">Your neighbourhood bookstore, online. Discover your next favourite read.</p>
        </div>
        <nav aria-label="Shop">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">Shop</h2>
          <ul className="space-y-1 text-sm">
            <li><Link className="hover:text-accent" to="/books">All books</Link></li>
            <li><Link className="hover:text-accent" to="/books?sort=newest">New arrivals</Link></li>
            <li><Link className="hover:text-accent" to="/books?sort=rating">Top rated</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">Account</h2>
          <ul className="space-y-1 text-sm">
            <li><Link className="hover:text-accent" to="/orders">Order history</Link></li>
            <li><Link className="hover:text-accent" to="/wishlist">Wishlist</Link></li>
            <li><Link className="hover:text-accent" to="/cart">Cart</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">Help</h2>
          <p className="text-sm">support@pageturner.example</p>
          <p className="text-sm">Mon-Sat, 9am - 6pm IST</p>
        </div>
      </div>
      <div className="border-t border-slate-700 py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} PageTurner. Demo project - payments are simulated.
      </div>
    </footer>
  );
}
