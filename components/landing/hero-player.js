"use client";

import { useState } from "react";
import { LockGlyph, PlayGlyph } from "@/components/landing/glyphs";

const LECTURES = [
  { title: "What React actually renders", duration: "6:40", free: true, code: "greeting" },
  { title: "Components and props", duration: "11:05", free: true, code: "card" },
  { title: "State with useState", duration: "14:22" },
  { title: "Effects without the bugs", duration: "17:48" },
  { title: "Lifting state up", duration: "9:30" },
  { title: "Your first custom hook", duration: "12:15" },
];

function Code({ kind }) {
  if (kind === "card") {
    return (
      <>
        <span className="k">function</span> Card({"{ title, price }"}) {"{"}
        {"\n  "}
        <span className="k">return</span> {"<h3>{title} · {price}</h3>"}
        {"\n}\n"}
        {"<Card title="}
        <span className="s">&quot;React&quot;</span> price=<span className="s">&quot;₹1,499&quot;</span> {"/>"}
        {"\n"}
        <span className="c">{"// props flow down, one way."}</span>
      </>
    );
  }
  return (
    <>
      <span className="k">function</span> Greeting({"{ name }"}) {"{"}
      {"\n  "}
      <span className="k">return</span> {"<h1>Hello, {name}</h1>"}
      {"\n}\n"}
      <span className="c">{"// React calls this, gets elements back,"}</span>
      {"\n"}
      <span className="c">{"// and updates only what changed."}</span>
    </>
  );
}

/**
 * A sample of the course player, as decoration. Free previews switch the slide; locked lectures point down to
 * the purchase states, like the real player does.
 */
export function HeroPlayer() {
  const [index, setIndex] = useState(0);
  const current = LECTURES[index];

  function pick(i) {
    if (!LECTURES[i].free) {
      document.getElementById("prices")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setIndex(i);
  }

  return (
    <figure className="player" data-ui aria-label="A sample of the Learnly course player">
      <div className="player-top">
        <b>React, from components to hooks</b>
        <span>Sample course · 6 lectures · 1 h 11 min</span>
      </div>
      <div className="video">
        <div className="slide-title">{current.title}</div>
        <pre aria-hidden="true">
          <Code kind={current.code} />
        </pre>
        <div className="scrub" aria-hidden="true">
          <PlayGlyph />
          <span>2:31</span>
          <div className="bar">
            <i />
          </div>
          <span>{current.duration}</span>
        </div>
      </div>
      <div className="lectures">
        <h4>Course content</h4>
        {LECTURES.map((l, i) => (
          <button
            key={l.title}
            type="button"
            className={`lec${i === index ? " on" : ""}${l.free ? " free" : ""}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => pick(i)}
          >
            <span className="ic">{l.free ? <PlayGlyph /> : <LockGlyph />}</span>
            <span className="t">
              {l.title}
              {l.free && <small>Free preview</small>}
            </span>
            <span className="d">{l.duration}</span>
          </button>
        ))}
      </div>
    </figure>
  );
}
