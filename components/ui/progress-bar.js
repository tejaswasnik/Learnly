/** Thin progress bar with the right semantics for assistive technology. */
export function ProgressBar({ percent, label, className = "" }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}
    >
      <div className="h-full rounded-full bg-accent-light transition-[width] duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}
