import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../context/auth/useAuth';

export default function PublicRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to='/chat' replace />;
  }

  return <Outlet />;
}
