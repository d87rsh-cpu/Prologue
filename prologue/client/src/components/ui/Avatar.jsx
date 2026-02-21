export default function Avatar({ src, alt = '', name, size = 'md', className = '' }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initial = name ? name.trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div
      className={`rounded-lg bg-accent flex items-center justify-center font-medium text-text-primary shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : initial}
    </div>
  );
}
