// Icons are the exact SVGs exported from the Figma file, served from /public/icons.
export function Icon({ name, size = 20, className = "" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static decorative SVG with fixed dimensions
    <img src={`/icons/${name}.svg`} alt="" width={size} height={size} className={`shrink-0 ${className}`} draggable={false} />
  );
}
