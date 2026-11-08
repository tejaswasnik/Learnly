import { Lock, Play, Search } from "lucide-react";

/** The tiny glyphs the landing page's interface fragments use. Decorative, so hidden from assistive tech. Sizes come from landing.css. */
export function PlayGlyph(props) {
  return <Play aria-hidden="true" fill="currentColor" strokeWidth={1.5} {...props} />;
}

export function LockGlyph(props) {
  return <Lock aria-hidden="true" strokeWidth={2.25} {...props} />;
}

export function SearchGlyph(props) {
  return <Search aria-hidden="true" strokeWidth={2.25} {...props} />;
}
