import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Toast from '../common/Toast';

export default function Layout() {
  const { pathname, state } = useLocation();
  // Payment and the "purchase successful" screens sit on the full-bleed illustrated background.
  const scene = pathname === '/payment' || (pathname.startsWith('/order-success/') && !!state?.fresh);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      {scene ? (
        <main id="main" className="scene flex flex-1 items-center justify-center px-4 py-8" tabIndex={-1}>
          <Outlet />
        </main>
      ) : (
        <main id="main" className="container-page flex-1 py-6" tabIndex={-1}>
          <Outlet />
        </main>
      )}
      {!scene && <Footer />}
      <Toast />
    </div>
  );
}
