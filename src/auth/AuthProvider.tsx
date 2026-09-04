import { useEffect, useState, type ReactNode } from 'react';
import type { TUser } from '../types/auth.types';
import AuthContext from './AuthContext';
import fetchApi from '../lib/api/fetch';
import type { TApiResponse } from '../types/common.types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const checkAuthData = await fetchApi<TApiResponse<TUser>>('/me');

        setUser(checkAuthData.data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
