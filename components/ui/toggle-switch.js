"use client";

import { Icon } from "@/components/ui/icon";

export function ToggleSwitch({ checked, onChange, label, disabled = false, busy = false, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-11 items-center gap-3 rounded-base text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light disabled:cursor-not-allowed ${busy ? "opacity-60" : ""} ${className}`}
    >
      <Icon name={checked ? "toggle-on" : "toggle-off"} size={44} />
      <span>{label}</span>
    </button>
  );
}
