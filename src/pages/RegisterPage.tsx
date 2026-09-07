import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchApi from '../lib/api/fetch';
import notify from '../lib/toast/toast';
import type { TUser } from '../types/auth.types';
import type { TApiResponse } from '../types/common.types';
import Button from '../components/common/Button';

function LoginPage() {
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim();
    const email = emailRef.current?.value.trim();
    const password = passwordRef.current?.value;

    if (!name || !email || !password) {
      return;
    }

    try {
      setLoading(() => true);
      const registerData = await fetchApi<TApiResponse<TUser>>('/signup', {
        method: 'POST',
        body: {
          name,
          email,
          password,
        },
      });
      notify.success(registerData.message);
      navigate('/login');
    } catch (err) {
      notify.error(`${err}`);
    } finally {
      setLoading(() => false);
    }
  };

  return (
    <>
      <section className='flex h-dvh items-center justify-center'>
        <form onSubmit={handleSubmit} className='bg-green-100 p-8 rounded-sm'>
          <div className='flex justify-between gap-2 mb-2'>
            <label htmlFor='name'>Name</label>
            <input ref={nameRef} type='text' name='name' id='name' />
          </div>
          <div className='flex justify-between gap-2 mb-2'>
            <label htmlFor='email'>Email</label>
            <input ref={emailRef} type='email' name='Email' id='email' />
          </div>
          <div className='flex justify-between gap-2 mb-4'>
            <label htmlFor='password'>Password</label>
            <input ref={passwordRef} type='password' name='Password' id='password' />
          </div>
          <Button type='submit' className='w-full mb-4' loading={loading}>
            Register
          </Button>
          <div className='flex justify-end items-center'>
            <a href='/login'>Proceed to Login</a>
          </div>
        </form>
      </section>
    </>
  );
}

export default LoginPage;
