"use client";

import { useState } from "react";

const STAGES = [
  {
    name: "Create an account",
    text: "Your name, your email and a password of eight characters or more. Pick Student or Instructor.",
    form: true,
  },
  { name: "Log in", text: "Log in with your email and password. Your session stays signed in on this device for a week." },
  { name: "Find a course", text: "Search titles and topics, narrow by category, and sort by newest or by price." },
  { name: "Pay or enroll", text: "Paid courses check out through Razorpay. Free courses enroll you the moment you click." },
  { name: "Start watching", text: "Every lecture opens in the course player, with the whole course listed beside the video." },
];

function SignUpSample() {
  return (
    <div className="shot" aria-hidden="true">
      <div className="form">
        <b style={{ fontSize: 20, fontWeight: 600 }}>Join Learnly</b>
        <div className="f">
          <span className="lab">Name</span>
          <div className="in">Priya Kulkarni</div>
        </div>
        <div className="f">
          <span className="lab">Email</span>
          <div className="in">priya@college.edu</div>
        </div>
        <div className="roles">
          <span className="on">Student</span>
          <span>Instructor</span>
        </div>
        <div className="go">Create account</div>
      </div>
    </div>
  );
}

/** Five-stage accordion: one stage open at a time, each reachable by keyboard. */
export function HowItWorks() {
  const [open, setOpen] = useState(0);
  return (
    <section className="how" id="how" aria-labelledby="how-title">
      <div className="g12 head">
        <h2 id="how-title" className="rise">
          Sign up to lecture one
        </h2>
        <p className="rise">
          Five steps, and most of them take a minute. Free courses skip checkout; paid ones are verified on our server before a single
          locked lecture opens.
        </p>
      </div>
      <div className="acc rise">
        {STAGES.map((s, i) => {
          const isOpen = open === i;
          return (
            <div
              key={s.name}
              className={`stage${isOpen ? " open" : ""}`}
              {...(isOpen ? {} : { role: "button", tabIndex: 0, "aria-expanded": false, "aria-label": s.name })}
              onClick={() => setOpen(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(i);
                }
              }}
            >
              <span className="vname" aria-hidden="true">
                {s.name}
              </span>
              <div className="body">
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </div>
                {s.form && <SignUpSample />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
