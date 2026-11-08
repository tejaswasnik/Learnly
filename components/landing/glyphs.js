/** The two tiny glyphs the landing page's interface fragments use. Decorative, so hidden from assistive tech. */
export function PlayGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.6v8.8c0 .5.5.8.9.5l6.6-4.4a.6.6 0 0 0 0-1L3.9 1.1c-.4-.3-.9 0-.9.5Z" fill="currentColor" />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.5 5V3.8a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}
