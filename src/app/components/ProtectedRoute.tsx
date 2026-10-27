import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute — redirects unauthenticated users to /login
 * Wrap any route that requires user to be logged in.
 */
export function ProtectedRoute() {
  const token = localStorage.getItem('userToken');
  const user = localStorage.getItem('currentUser');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
