import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import SearchBar from '../common/SearchBar';
import { CartIcon, CloseIcon, LibraryIcon, MenuIcon, UserIcon } from '../common/Icons';

const linkClass = ({ isActive }) =>
  `px-3 py-3 text-sm transition-colors hover:bg-layer-2 hover:text-white ${isActive ? 'text-white shadow-[inset_0_-2px_0_#0f62fe]' : 'text-muted'}`;

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const wishlist = useWishlist();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // The catalog has its own search field in the filter bar, so the header one is hidden there.
  const showSearch = pathname !== '/books';

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <a href="#main" className="sr-only-focusable bg-primary px-3 py-2 text-sm text-white">
        Skip to content
      </a>
      <div className="flex h-12 items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold text-white" aria-label="Book Worm home">
          <LibraryIcon className="text-white" />
          <span>Book Worm</span>
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-line md:block" aria-hidden="true" />

        <nav aria-label="Primary" className="hidden items-stretch md:flex">
          <NavLink to="/books" className={linkClass}>
            Books
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/wishlist" className={linkClass}>
              My Wishlist{wishlist.items.length > 0 && <span className="ml-1 text-xs text-subtle">({wishlist.items.length})</span>}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        {showSearch && (
          <div className="ml-auto hidden w-full max-w-sm md:block">
            <SearchBar />
          </div>
        )}

        <div className={`${showSearch ? '' : 'ml-auto'} hidden items-center gap-1 md:flex`}>
          <NavLink to="/cart" className="relative grid h-12 w-12 place-items-center text-white hover:bg-layer-2" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && (
              <span className="absolute right-1.5 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#da1e28] px-1 text-[10px] font-semibold leading-none text-white">
                {count}
              </span>
            )}
          </NavLink>
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pr-1">
              <span className="flex items-center gap-2 text-sm text-muted">
                <UserIcon className="text-white" />
                <span>Hi, {user.name.split(' ')[0]}</span>
                <span className="bg-layer-2 px-2 py-0.5 text-xs text-white">{user.rewardPoints} pts</span>
              </span>
              <button type="button" onClick={handleLogout} className="text-sm text-muted hover:text-white">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex h-12 items-center gap-2 px-3 text-sm text-white hover:bg-layer-2">
              <UserIcon />
              <span>Sign in</span>
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center md:hidden">
          <NavLink to="/cart" className="relative grid h-12 w-12 place-items-center text-white" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && (
              <span className="absolute right-1.5 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#da1e28] px-1 text-[10px] font-semibold leading-none text-white">
                {count}
              </span>
            )}
          </NavLink>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center text-white hover:bg-layer-2"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon width={20} height={20} /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="space-y-1 border-t border-line bg-canvas px-4 pb-4 pt-3 md:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          {[
            ['/books', 'Books'],
            ...(isAuthenticated ? [['/orders', 'My Orders'], ['/wishlist', 'My Wishlist']] : []),
            ...(isAdmin ? [['/admin', 'Admin']] : []),
            ['/cart', `Cart (${count})`],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} onClick={close} className={(s) => `block ${linkClass(s)}`}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} className="block w-full px-3 py-3 text-left text-sm text-muted hover:bg-layer-2 hover:text-white">
              Logout ({user.name.split(' ')[0]})
            </button>
          ) : (
            <Link to="/login" onClick={close} className="btn-primary mt-2 w-full text-white">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
