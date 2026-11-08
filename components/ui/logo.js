import Link from "next/link";

export function LogoMark({ size = 30 }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG exported from Figma
    <img src="/brand/logo-mark.svg" alt="" width={size} height={size} className="shrink-0" draggable={false} />
  );
}

export function Logo({ href = "/", className = "" }) {
  return (
    <Link
      href={href}
      aria-label="Learnly home"
      className={`inline-flex items-center gap-3 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-light ${className}`}
    >
      <LogoMark />
      <span className="text-h3 text-ink">Learnly</span>
    </Link>
  );
}
