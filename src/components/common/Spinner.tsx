interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}
const sizeClassNames = { sm: 'h-4 w-4 border-2', md: 'h-5 w-5 border-2', lg: 'h-6 w-6 border-2' };
const Spinner = ({ size = 'sm' }: SpinnerProps) => {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-white border-t-transparent ${sizeClassNames[size]}`}
      role='status'
      aria-label='Loading'
    />
  );
};
export default Spinner;
