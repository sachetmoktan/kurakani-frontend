import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './auth/PrivateRoute';
import ChatPage from './pages/ChatPage';
import PublicRoute from './auth/PublicRoute';
import useAuth from './auth/useAuth';
import { useSocket } from './socket/useSocket';
import RegisterPage from './pages/RegisterPage';

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
