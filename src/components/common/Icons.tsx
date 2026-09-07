import ArrowLeft from '../../assets/svgs/arrow-left.svg';
import ArrowRight from '../../assets/svgs/arrow-right.svg';
import TrashSvg from '../../assets/svgs/trash.svg';
import VerticalDots from '../../assets/svgs/vertical-dots.svg';
import Button from './Button';

interface SpinnerProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  className?: string;
}
export const ChevronLeft = ({ onClick, className }: SpinnerProps) => {
  return (
    <div className={`absolute right-2 top-2 h-6 w-6 sm:h-8 sm:w-8 flex justify-center items-center ${className}`}>
      <Button className='h-full w-full rounded-full p-0' onClick={onClick}>
        <img src={ArrowLeft} alt='Chevron Left' className='w-4 h-4 sm:h-6 sm:w-6 brightness-0 invert' />
      </Button>
    </div>
  );
};

export const ChevronRight = ({ onClick, className }: SpinnerProps) => {
  return (
    <div className={`absolute left-0 top-0 h-6 w-6 sm:h-8 sm:w-8 flex justify-center items-center ${className}`}>
      <Button className='h-full w-full rounded-full p-0' onClick={onClick}>
        <img src={ArrowRight} alt='Chevron Right' className='w-4 h-4 sm:h-6 sm:w-6 brightness-0 invert' />
      </Button>
    </div>
  );
};

export const Trash = ({ onClick, className }: SpinnerProps) => {
  return (
    <div className={`h-6 w-6 sm:h-8 sm:w-8 flex justify-center items-center ${className}`}>
      <Button variant='transparent' className='h-full w-full p-0' onClick={onClick}>
        <img src={TrashSvg} alt='Three Dots' className='w-4 h-4 sm:h-6 sm:w-6' />
      </Button>
    </div>
  );
};

export const TrashIcon = ({ className }: { className?: string }) => {
  return (
    <>
      <img src={TrashSvg} alt='Trash' className={`w-2 h-2 sm:h-4 sm:w-4 ${className}`} />
    </>
  );
};

export const ThreeDots = ({ onClick, className }: SpinnerProps) => {
  return (
    <div className={`h-6 w-6 sm:h-8 sm:w-8 flex justify-center items-center ${className}`}>
      <Button variant='transparent' className='h-full w-full p-0' onClick={onClick}>
        <img src={VerticalDots} alt='Three Dots' className='w-4 h-4 sm:h-6 sm:w-6' />
      </Button>
    </div>
  );
};
