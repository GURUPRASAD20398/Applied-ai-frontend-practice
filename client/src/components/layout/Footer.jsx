import { Link } from 'react-router-dom';

const linkClass = 'text-muted hover:text-white';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-canvas text-muted">
      <div className="container-page grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold text-white">Book Worm</p>
          <p className="mt-2 text-xs">Your neighbourhood bookstore, online. Discover your next favourite read.</p>
        </div>
        <nav aria-label="Shop">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white">Shop</h2>
          <ul className="space-y-1 text-xs">
            <li><Link className={linkClass} to="/books">All books</Link></li>
            <li><Link className={linkClass} to="/books?sort=newest">New arrivals</Link></li>
            <li><Link className={linkClass} to="/books?sort=rating">Top rated</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white">Account</h2>
          <ul className="space-y-1 text-xs">
            <li><Link className={linkClass} to="/orders">Order history</Link></li>
            <li><Link className={linkClass} to="/wishlist">Wishlist</Link></li>
            <li><Link className={linkClass} to="/cart">Cart</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white">Help</h2>
          <p className="text-xs">support@pageturner.example</p>
          <p className="text-xs">Mon-Sat, 9am - 6pm IST</p>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-subtle">
        &copy; {new Date().getFullYear()} Book Worm. Demo project - payments are simulated.
      </div>
    </footer>
  );
}
