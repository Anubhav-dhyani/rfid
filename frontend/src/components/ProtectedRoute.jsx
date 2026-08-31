import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="app-loading"><div className="loader" /><span>Loading secure workspace…</span></div>;
  if (!admin) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
