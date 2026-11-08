import { FieldError, fieldClass } from "@/components/ui/text-field";
import { Icon } from "@/components/ui/icon";

function Helper({ id, error, helper }) {
  if (error) return <FieldError id={`${id}-error`}>{error}</FieldError>;
  return helper ? (
    <p id={`${id}-helper`} className="text-small text-muted">
      {helper}
    </p>
  ) : null;
}

const describedBy = (id, error, helper) => (error ? `${id}-error` : helper ? `${id}-helper` : undefined);

export function TextareaField({ id, label, error, helper, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small text-ink">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, helper)}
        className={`${fieldClass} h-[120px] resize-y py-3 ${className}`}
        {...props}
      />
      <Helper id={id} error={error} helper={helper} />
    </div>
  );
}

/** Native <select> wearing the design's field style, so it keeps full keyboard and screen-reader support. */
export function SelectField({ id, label, error, helper, options, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-small text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, helper)}
          className={`${fieldClass} appearance-none pr-12`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <Icon name="expand-more" size={24} />
        </span>
      </div>
      <Helper id={id} error={error} helper={helper} />
    </div>
  );
}
