"use client";

export function SegmentedControl({ label, value, onChange, options }) {
  function onKey(e) {
    const i = options.findIndex((o) => o.value === value);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = options[(next + options.length) % options.length];
    onChange(target.value);
    document.getElementById(`seg-${target.value}`)?.focus();
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className="inline-flex gap-1 rounded-base bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            id={`seg-${o.value}`}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`rounded-base px-6 py-3 text-button transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
              active ? "bg-accent text-accent-ink" : "text-ink hover:bg-border"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
