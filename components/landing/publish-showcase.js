"use client";

import { useState } from "react";

/** The "publish switch" section: the page itself flips between live and draft. */
export function PublishShowcase() {
  const [live, setLive] = useState(true);
  return (
    <section className={`showcase${live ? " live" : ""}`} id="teach" aria-labelledby="sc-title">
      <div className="copy rise">
        <h2 id="sc-title">
          Your course is <em>{live ? "live" : "a draft"}</em>.
        </h2>
        <p>
          Every course starts as a draft only you can see. One switch on your instructor dashboard puts it in the catalog for every
          student, and back again.
        </p>
        <p className="hint">
          <span className="q" style={{ background: "currentColor" }} aria-hidden="true" />
          Try the switch.
        </p>
      </div>
      <button type="button" className="switch" role="switch" aria-checked={live} aria-label="Published" onClick={() => setLive((v) => !v)}>
        <span className="lbl" aria-hidden="true">
          {live ? "Published" : "Draft"}
          <small>{live ? "Visible in the catalog" : "Only you can see it"}</small>
        </span>
        <span className="track" aria-hidden="true">
          <span className="knob" />
        </span>
      </button>
    </section>
  );
}
