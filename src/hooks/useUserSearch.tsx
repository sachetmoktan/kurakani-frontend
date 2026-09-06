import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants';
import type { TUser } from '../types/auth.types';
import { useDebounce } from './useDebounce';
import type { TApiResponse } from '../types/common.types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useUserSearch(email: string) {
  const debouncedEmail = useDebounce(email.trim(), 500);

  const [usersList, setUsersList] = useState<TUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultEmail, setResultEmail] = useState('');

  const isValidEmail = emailRegex.test(debouncedEmail);

  useEffect(() => {
    const controller = new AbortController();

    const searchUser = async () => {
      if (!isValidEmail) {
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/users/no-conversation-with/${debouncedEmail}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setResultEmail('');

        if (!response.ok) {
          throw new Error('Failed to search user');
        }

        const data: TApiResponse<TUser[]> = await response.json();

        setUsersList(() => data.data);
        setResultEmail(debouncedEmail);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error(error);

        setUsersList(() => null);
        setResultEmail(debouncedEmail);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    searchUser();

    return () => controller.abort();
  }, [debouncedEmail, isValidEmail]);

  const resetSearch = () => {
    setUsersList(() => null);
    // setLoading(false)
    setResultEmail(() => '');
  };

  return {
    usersList: resultEmail === debouncedEmail ? usersList : null,
    loading,
    searched: isValidEmail && resultEmail === debouncedEmail,
    resetSearch,
  };
}
