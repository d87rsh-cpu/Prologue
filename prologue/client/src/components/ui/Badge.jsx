const variantStyles = {
  default: 'bg-card-bg text-text-secondary border-border',
  primary: 'bg-accent/30 text-text-primary border-accent',
  highlight: 'bg-highlight/20 text-highlight border-highlight/40',
  success: 'bg-success/20 text-success border-success/40',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center font-medium text-xs
        px-2.5 py-0.5 rounded border
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
