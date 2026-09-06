import { useState } from 'react';
import { useUserSearch } from '../hooks/useUserSearch';
import type { TUser } from '../types/auth.types';

interface UserSearchInputProps {
  onSelect: (user: TUser) => void;
}

export function UserSearchInput({ onSelect }: UserSearchInputProps) {
  const [email, setEmail] = useState('');

  const { usersList, loading, searched, resetSearch } = useUserSearch(email);

  const showDropdown = loading || searched;

  return (
    <div className='relative w-full max-w-125'>
      <input
        type='email'
        value={email}
        onChange={event => setEmail(event.target.value)}
        placeholder='Search new user by email...'
        className='w-full rounded border px-3 py-2 outline-none'
      />

      {showDropdown && (
        <div className='absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded border bg-white shadow-lg'>
          {loading && <div className='px-3 py-2 text-sm text-gray-500'>Searching...</div>}

          {!loading &&
            usersList &&
            usersList.map(user => (
              <button
                key={user._id}
                type='button'
                onClick={() => {
                  resetSearch();
                  setEmail('');
                  onSelect(user);
                }}
                className='w-full px-3 py-2 text-left hover:bg-gray-100 hover:cursor-pointer'
              >
                <div className='font-medium'>{user.name}</div>

                <div className='text-sm text-gray-500'>{user.email}</div>
              </button>
            ))}

          {!loading && searched && usersList && usersList?.length < 1 && (
            <div className='px-3 py-2 text-sm text-gray-500'>No new user found</div>
          )}
        </div>
      )}
    </div>
  );
}
