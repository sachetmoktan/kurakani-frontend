import { jwtDecode } from 'jwt-decode';
import { useMemo, useState } from 'react';
import type { AccessTokenPayload } from '../../types/auth.types';
import AuthContext from './AuthContext';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'));

  const setToken = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setTokenState(newToken);
  };

  const removeToken = () => {
    localStorage.removeItem('token');
    setTokenState(null);
  };

  const payload = useMemo(() => {
    if (!token) return null;

    try {
      return jwtDecode<AccessTokenPayload>(token);
    } catch {
      return null;
    }
  }, [token]);

  const value = {
    token,
    payload,
    isAuthenticated: !!token,
    setToken,
    removeToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
