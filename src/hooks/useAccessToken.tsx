import { jwtDecode } from 'jwt-decode';
import type { AccessTokenPayload } from '../types/auth.types';
import { useLocalStorage } from './useLocalStorage';

export function useAccessToken() {
  const { value: token, set: setToken, remove: removeToken, hasValue } = useLocalStorage<string>('token');

  const payload = token ? jwtDecode<AccessTokenPayload>(token) : undefined;

  console.log({ token, ppp: token ? jwtDecode(token) : null, payload });

  return {
    token,
    payload,
    isAuthenticated: hasValue(),
    setToken,
    removeToken,
  };
}
