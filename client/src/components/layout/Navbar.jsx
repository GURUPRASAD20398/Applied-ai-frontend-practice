import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import SearchBar from '../common/SearchBar';

const linkClass = ({ isActive }) =>
  `rounded px-2 py-1 text-sm font-medium hover:text-accent ${isActive ? 'text-accent' : 'text-white'}`;

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 bg-secondary shadow">
      <a href="#main" className="sr-only-focusable rounded bg-accent px-3 py-2 text-sm font-semibold text-slate-900">
        Skip to content
      </a>
      <div className="container-page flex items-center gap-3 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-white" aria-label="PageTurner home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-base" aria-hidden="true">
            P
          </span>
          <span>
            Page<span className="text-accent">Turner</span>
          </span>
        </Link>

        <div className="mx-4 hidden max-w-xl flex-1 md:block">
          <SearchBar />
        </div>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-2 md:flex">
          <NavLink to="/books" className={linkClass}>
            Books
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/wishlist" className={linkClass}>
              Wishlist{wishlist.items.length > 0 && <span className="ml-1 text-xs text-accent">({wishlist.items.length})</span>}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          <NavLink to="/cart" className={linkClass} aria-label={`Cart, ${count} items`}>
            Cart
            <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-slate-900">{count}</span>
          </NavLink>
          {isAuthenticated ? (
            <div className="ml-2 flex items-center gap-3 border-l border-slate-600 pl-3">
              <span className="text-sm text-slate-200">
                Hi, {user.name.split(' ')[0]}
                <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs text-accent">{user.rewardPoints} pts</span>
              </span>
              <button type="button" onClick={handleLogout} className="text-sm font-medium text-white hover:text-accent">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-accent ml-2 px-4 py-1.5">
              Sign in
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="ml-auto rounded p-2 text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {open ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="space-y-1 border-t border-slate-700 px-4 pb-4 pt-3 md:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          {[
            ['/books', 'Books'],
            ...(isAuthenticated ? [['/orders', 'Orders'], ['/wishlist', 'Wishlist']] : []),
            ...(isAdmin ? [['/admin', 'Admin']] : []),
            ['/cart', `Cart (${count})`],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} onClick={close} className={(s) => `block py-2 ${linkClass(s)}`}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} className="block w-full py-2 text-left text-sm font-medium text-white">
              Logout ({user.name.split(' ')[0]})
            </button>
          ) : (
            <Link to="/login" onClick={close} className="btn-accent mt-2 w-full">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
