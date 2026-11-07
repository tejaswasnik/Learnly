"use client";

import { useEffect, useRef, useState } from "react";

export function Avatar({ name = "", src, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size };

  // A server-rendered <img> can fail before hydration, so onError never fires; check once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        style={style}
        className="grid shrink-0 place-items-center rounded-full bg-t3 text-small font-semibold text-accent-ink"
      >
        {initial}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote avatar of unknown host; falls back to initials on error
    <img ref={imgRef} src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" onError={() => setFailed(true)} />
  );
}
