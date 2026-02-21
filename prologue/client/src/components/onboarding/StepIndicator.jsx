export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium shrink-0
                ${i < currentStep ? 'bg-success text-primary' : i === currentStep ? 'bg-accent text-text-primary' : 'bg-card-bg text-text-secondary border border-border'}
              `}
            >
              {i + 1}
            </div>
            <span className={`text-sm whitespace-nowrap ${i <= currentStep ? 'text-text-primary' : 'text-text-secondary'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="w-8 h-px bg-border mx-1 shrink-0" aria-hidden />}
        </div>
      ))}
    </div>
  );
}
