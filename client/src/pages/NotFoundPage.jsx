import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-light text-primary">404</p>
      <h1 className="mt-2 text-2xl font-light text-white">Page not found</h1>
      <p className="mt-1 text-muted">The page you are looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
