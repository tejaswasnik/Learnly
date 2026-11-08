import { avatarSrc } from "@/lib/shared/avatar";

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

// The uploaded photo when there is one (resized by ImageKit), otherwise initials.
export function Avatar({ name = "", photourl, size = "md", className = "" }) {
  const src = avatarSrc(photourl, size === "lg" ? 160 : 96);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-t2 text-ink ${SIZES[size]} ${className}`}
    >
      {src ? (
        // A plain img on purpose: ImageKit already resizes, and avatars are tiny.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
