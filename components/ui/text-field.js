import { Icon } from "@/components/ui/icon";

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-2 text-small text-danger">
      <Icon name="error-field" size={16} />
      {children}
    </p>
  );
}

export const fieldClass =
  "h-12 w-full rounded-base bg-field px-4 py-1 text-body text-field-ink placeholder:text-field-muted " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light " +
  "disabled:opacity-50 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger";

export function TextField({ id, label, error, helper, className = "", ...props }) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${fieldClass} ${className}`}
        {...props}
      />
      {helper && !error && (
        <p id={`${id}-helper`} className="text-small text-muted">
          {helper}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
