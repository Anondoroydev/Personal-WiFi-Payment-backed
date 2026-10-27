import { Navigate, Outlet } from 'react-router-dom';

/**
 * AdminProtectedRoute — allow access when adminToken/adminUser present
 */
export function AdminProtectedRoute() {
  const token = localStorage.getItem('adminToken');
  const user = localStorage.getItem('adminUser');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
