import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hoverLift = false,
  ...props
}) {
  const baseClasses = 'bg-card-bg border border-border rounded-lg text-text-primary shadow-card';

  if (hoverLift) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={`${baseClasses} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
