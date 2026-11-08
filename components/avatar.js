const SIZES = {
  sm: "size-8 text-small",
  md: "size-10 text-small",
  lg: "size-16 text-body font-semibold",
};

export function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

// Initials only: the MVP has no avatar uploads (see Avatar in 02 Components).
export function Avatar({ name = "", size = "md", className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-t2 text-ink ${SIZES[size]} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
