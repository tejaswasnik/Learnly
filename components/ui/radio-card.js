import { Icon } from "@/components/ui/icon";

export function RadioCard({ name, value, checked, onChange, title, description, icon }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 overflow-hidden rounded-base p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-light ${
        checked ? "border-2 border-accent-light bg-t1" : "border-2 border-transparent bg-surface hover:bg-surface-2"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-base ${checked ? "bg-t2" : "bg-surface-2"}`}>
        <Icon name={icon} size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-small text-muted">{description}</span>
      </span>
      {checked ? (
        <Icon name="radio-selected" size={24} />
      ) : (
        <span aria-hidden="true" className="size-6 shrink-0 rounded-full border-2 border-muted" />
      )}
    </label>
  );
}
