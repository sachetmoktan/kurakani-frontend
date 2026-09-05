import { createContext } from 'react';
import type { AuthContextValue } from '../../types/auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);
export default AuthContext;
