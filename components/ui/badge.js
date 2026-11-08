import { Icon } from "@/components/ui/icon";

const VARIANTS = {
  enrolled: { className: "bg-success text-field-ink", icon: "check-badge", label: "Enrolled" },
  "free-preview": { className: "bg-t1 text-ink", icon: "play-arrow-badge", label: "Free preview" },
  free: { className: "bg-t1 text-ink", icon: null, label: "Free" },
};

export function Badge({ variant, label, className = "" }) {
  const v = VARIANTS[variant];
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-xs px-2 text-caption ${v.className} ${className}`}>
      {v.icon && <Icon name={v.icon} size={16} />}
      {label ?? v.label}
    </span>
  );
}
