import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Toast from '../common/Toast';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="container-page flex-1 py-6" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
