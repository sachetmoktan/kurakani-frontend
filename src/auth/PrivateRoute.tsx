// src/components/PrivateRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import useAuth from './useAuth';

export default function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}
