import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import PrivateRoute from './auth/PrivateRoute';
import PublicRoute from './auth/PublicRoute';
import useAuth from './context/auth/useAuth';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useSocket } from './socket/useSocket';

function App() {
  const { isAuthenticated } = useAuth();

  useSocket(isAuthenticated);

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/' element={<Navigate to='/chat' replace />} />
        <Route path='*' element={<Navigate to='/chat' replace />} />
      </Route>

      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  );
}

export default App;
