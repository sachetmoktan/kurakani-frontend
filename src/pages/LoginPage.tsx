import { useRef } from 'react';
import useAuth from '../auth/useAuth';
import fetchApi from '../lib/api/fetch';
import notify from '../lib/toast/toast';
import type { TUser } from '../types/auth.types';
import type { TApiResponse } from '../types/common.types';

function LoginPage() {
  const { setUser } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = emailRef.current?.value.trim();
    const password = passwordRef.current?.value;

    if (!email || !password) {
      return;
    }

    try {
      const loginData = await fetchApi<TApiResponse<TUser>>('/login', {
        method: 'POST',
        body: {
          email,
          password,
        },
      });
      console.log('DataHereMan: ', loginData);
      setUser(loginData.data);
      notify.success(loginData.message);
    } catch (err) {
      notify.error(`${err}`);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='email'>Email</label>
          <input ref={emailRef} type='email' name='Email' id='email' />
        </div>
        <div>
          <label htmlFor='password'>Password</label>
          <input ref={passwordRef} type='password' name='Password' id='password' />
        </div>
        <button type='submit'>Login</button>
      </form>
    </>
  );
}

export default LoginPage;
