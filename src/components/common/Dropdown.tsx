import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Button from './Button';
export interface DropdownOption<T = string> {
  label: string;
  value: T;
  icon?: ReactNode;
  disabled?: boolean;
}
export interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value?: T;
  defaultValue?: T;
  placeholder?: string;
  onChange?: ({ label, value }: { value: T; label: string }) => void;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  icon?: ReactNode;
  closeOnSelect?: boolean;
}
type TMenuPosition = 'left' | 'right' | 'top' | 'bottom';
const Dropdown = <T,>({
  options,
  value,
  defaultValue,
  placeholder = '',
  onChange,
  disabled = false,
  className = '',
  menuClassName = '',
  optionClassName = '',
  icon,
  closeOnSelect = true,
}: DropdownProps<T>) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const [menuPosition, setMenuPosition] = useState<TMenuPosition>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(option => option.value === selectedValue);
  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    setInternalValue(option.value);
    onChange?.({ value: option.value, label: option.label });
    if (closeOnSelect) {
      setOpen(false);
    }
  };
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Automatically determine dropdown position
  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !menuRef.current) {
      return;
    }

    const dropdown = dropdownRef.current;
    const menu = menuRef.current;
    const parent = dropdown.parentElement;

    if (!parent) return;

    const dropdownRect = dropdown.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const spaceLeft = dropdownRect.left - parentRect.left;
    const spaceRight = parentRect.right - dropdownRect.right;
    // const spaceTop = dropdownRect.top - parentRect.top;
    const spaceBottom = parentRect.bottom - dropdownRect.bottom;

    if (spaceRight >= menuRect.width) {
      setMenuPosition('right');
    } else if (spaceLeft >= menuRect.width) {
      setMenuPosition('left');
    } else if (spaceBottom >= menuRect.height) {
      setMenuPosition('bottom');
    } else {
      setMenuPosition('top');
    }
  }, [open]);
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {' '}
      {/* Trigger */}{' '}
      <Button disabled={disabled} variant='transparent' className='p-0' onClick={() => setOpen(prev => !prev)}>
        {' '}
        {icon ? (
          icon
        ) : (
          <span className='flex items-center gap-2'>
            {' '}
            {selectedOption?.icon} <span> {selectedOption?.label ?? placeholder} </span>{' '}
          </span>
        )}{' '}
      </Button>{' '}
      {/* Menu */}{' '}
      {open && (
        <div
          ref={menuRef}
          className={`absolute z-50 w-max max-w-64 border rounded-md bg-white ${menuPosition === 'right' ? 'left-full ml-1' : menuPosition === 'left' ? 'right-full mr-1' : menuPosition === 'top' ? 'bottom-full mb-1 left-0' : 'top-full mt-1 left-0'} ${menuClassName}`}
        >
          {' '}
          {options.map(option => (
            <Button
              key={String(option.value)}
              disabled={option.disabled}
              variant='transparent'
              className={`p-0 flex w-full items-center justify-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 ${optionClassName}`}
              onClick={() => handleSelect(option)}
            >
              {' '}
              {option.icon && <span className='flex shrink-0 items-center'> {option.icon} </span>}{' '}
              <span className='text-[clamp(0.4rem,4vw,0.7rem)]'> {option.label} </span>{' '}
            </Button>
          ))}{' '}
        </div>
      )}{' '}
    </div>
  );
};
export default Dropdown;
