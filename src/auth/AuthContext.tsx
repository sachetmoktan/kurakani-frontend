import { createContext } from 'react';
import type { TUser } from '../types/auth.types';

type AuthContextType = {
  user: TUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: TUser | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
