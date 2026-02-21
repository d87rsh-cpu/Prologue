import { motion } from 'framer-motion';

const variantStyles = {
  primary: 'bg-accent text-text-primary border-transparent hover:opacity-90 focus-visible:ring-accent',
  secondary: 'bg-transparent text-text-primary border border-border hover:bg-card-bg focus-visible:ring-border',
  highlight: 'bg-highlight text-white border-transparent hover:opacity-90 focus-visible:ring-highlight',
  success: 'bg-success text-primary border-transparent hover:opacity-90 focus-visible:ring-success',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        inline-flex items-center justify-center font-medium border
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}
