export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center mb-4 text-text-secondary">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-lg bg-accent text-text-primary font-medium hover:opacity-90 transition-opacity"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
