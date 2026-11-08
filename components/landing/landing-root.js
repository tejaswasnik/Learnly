"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps the landing page and reveals `.rise` elements as they scroll into view. Elements already on screen
 * are marked visible before the hidden state is switched on, so nothing flashes; without JavaScript
 * (or with reduced motion, see the CSS) everything stays visible.
 */
export function LandingRoot({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = [...root.querySelectorAll(".rise")];
    const vh = window.innerHeight;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("in");
    }
    root.setAttribute("data-js", "");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll("section").forEach((section) => {
      section.querySelectorAll(".rise:not(.in)").forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i * 75, 300)}ms`;
        io.observe(el);
      });
    });
    return () => {
      io.disconnect();
      root.removeAttribute("data-js");
    };
  }, []);

  return (
    <div ref={ref} className="lp">
      {children}
    </div>
  );
}
