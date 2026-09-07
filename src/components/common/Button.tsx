import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: TButtonVariants;
}

export type TButtonVariants = 'primary' | 'secondary' | 'danger' | 'info' | 'transparent' | 'no-outline';

const mapClassnameByVariant = (variant: TButtonVariants) => {
  switch (variant) {
    case 'primary':
      return 'text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400';
    case 'secondary':
      return 'text-white bg-green-500 hover:bg-green-600 disabled:bg-green-400';
    case 'danger':
      return 'text-white bg-red-500 hover:bg-red-600 disabled:bg-red-400';
    case 'info':
      return 'text-white bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100';
    case 'transparent':
      return 'text-black bg-transparent hover:bg-gray-300 disabled:bg-gray-100';
    case 'no-outline':
      return 'text-black bg-white hover:bg-gray-300 disabled:bg-gray-100';
    default:
      return 'text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400';
  }
};

const Button = ({
  children,
  type = 'button',
  className = '',
  disabled = false,
  variant = 'primary',
  loading = false,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={twMerge(
        'px-4 py-2 rounded-md font-medium border-0 hover:cursor-pointer disabled:opacity-50',
        mapClassnameByVariant(variant),
        className,
      )}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};

export default Button;

// Usage
// <Button
//   type='button'
//   onClick={() => console.log('Clicked')}
//   disabled={false}
//   variant='primary'
//   className='bg-blue-500 text-white'
//   id='submit-button'
//   aria-label='Submit form'
// >
//   Submit
// </Button>;
