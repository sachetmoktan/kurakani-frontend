import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../context/auth/useAuth';

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}
