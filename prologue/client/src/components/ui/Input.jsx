export default function Input({
  className = '',
  error = false,
  ...props
}) {
  return (
    <input
      className={`
        w-full bg-secondary border rounded-lg px-3 py-2
        text-text-primary placeholder-text-secondary
        focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? 'border-highlight focus:ring-highlight' : 'border-border'}
        ${className}
      `}
      {...props}
    />
  );
}
