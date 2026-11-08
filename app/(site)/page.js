import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { HeroPlayer } from "@/components/landing/hero-player";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingRoot } from "@/components/landing/landing-root";
import { LockGlyph, PlayGlyph } from "@/components/landing/glyphs";
import { PublishShowcase } from "@/components/landing/publish-showcase";
import { getCurrentUser } from "@/lib/server/auth";
import { listPublishedCourses } from "@/lib/server/services/courses";
import { CATEGORIES } from "@/lib/shared/constants";
import "@/components/landing/landing.css";

export const metadata = {
  title: { absolute: "Learnly — Buy a course, watch every lecture" },
  description:
    "Learnly is a course marketplace: instructors publish video courses, students buy them with Razorpay and watch every lecture in one player.",
  alternates: { canonical: "/" },
};

const FAQ = [
  {
    q: "Can I watch before I pay?",
    a: "Yes. Instructors can mark any lecture as a free preview, and it plays on the course page without an account. The rest of the course stays locked until you enroll.",
  },
  {
    q: "How do I pay for a course?",
    a: "Through Razorpay Checkout, which opens on the course page. We verify the payment on our server before enrolling you. Free courses skip payment entirely.",
  },
  {
    q: "What if I click Buy twice?",
    a: "You can’t buy a course you already own. Once you are enrolled, the button reads Start course and takes you straight to the player.",
  },
  {
    q: "How do I start teaching?",
    a: "Choose Instructor when you sign up. You get an instructor dashboard where you create a course, upload lectures, mark free previews and publish when it’s ready.",
  },
  {
    q: "What can I upload?",
    a: "Lecture videos up to 500 MB, uploaded straight from your browser, or a YouTube link. Course thumbnails can be JPEG, PNG or WebP up to 5 MB.",
  },
  {
    q: "Can someone share my lecture links?",
    a: "Uploaded videos are served through signed links that expire after an hour, and only to enrolled students, the course’s instructor and admins.",
  },
];

async function loadFeatured() {
  try {
    return await listPublishedCourses({ limit: 3, sort: "newest" });
  } catch {
    // The landing page must render even if the database is unreachable.
    return { courses: [], total: 0 };
  }
}

function teachLink(user) {
  if (!user) return { href: "/register", label: "Teach on Learnly" };
  if (user.role === "instructor") return { href: "/instructor/dashboard", label: "Instructor dashboard" };
  if (user.role === "admin") return { href: "/instructor/dashboard", label: "Instructor dashboard" };
  return null; // students: nothing to teach with, the navbar already links their dashboard
}

export default async function LandingPage() {
  const [user, featured] = await Promise.all([getCurrentUser(), loadFeatured()]);
  const teach = teachLink(user);
  const dashboardHref = user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard";

  return (
    <LandingRoot>
      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Learn it here.</span>
              <span>Then teach it.</span>
            </h1>
            <p className="lede">
              Learnly is a course marketplace. Instructors publish video courses, students buy them with Razorpay and watch every lecture
              in one player.
            </p>
            <div className="actions">
              <Link className="btn" href="/courses">
                Browse courses
                <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M3 1.6v8.8c0 .5.5.8.9.5l6.6-4.4a.6.6 0 0 0 0-1L3.9 1.1c-.4-.3-.9 0-.9.5Z" fill="currentColor" />
                </svg>
              </Link>
              {teach && (
                <Link className="link" href={teach.href}>
                  {teach.label}
                </Link>
              )}
            </div>
          </div>
          <div className="hero-stage">
            <div className="hero-shape" aria-hidden="true" />
            <HeroPlayer />
          </div>
        </section>

        <section className="intro" aria-label="How a course works on Learnly">
          <p className="rise">
            Find a course <span className="thumb th-a" aria-hidden="true" />, watch its free previews{" "}
            <span className="thumb th-b" aria-hidden="true" />, pay once with Razorpay <span className="thumb th-c" aria-hidden="true" />, and
            every lecture opens in your player <span className="thumb th-d" aria-hidden="true" />.
          </p>
        </section>

        {featured.courses.length > 0 && (
          <section className="featured" aria-labelledby="featured-title">
            <div className="featured-head rise">
              <h2 id="featured-title">New on Learnly</h2>
              <Link className="link" href="/courses">
                All courses
              </Link>
            </div>
            <ul className="featured-grid">
              {featured.courses.map((course) => (
                <li key={course.id} className="rise">
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <PublishShowcase />
        <HowItWorks />

        <section className="features" aria-labelledby="ft-title">
          <div className="board">
            <div className="tile t-a rise">
              <div className="el" data-ui aria-hidden="true">
                <div className="mini-lec free">
                  <span className="ic">
                    <PlayGlyph />
                  </span>
                  <span className="nm">Components and props</span>
                  <span className="tag">Free preview</span>
                  <span className="du">11:05</span>
                </div>
                <div className="mini-lec">
                  <span className="ic">
                    <LockGlyph />
                  </span>
                  <span className="nm">State with useState</span>
                  <span className="du">14:22</span>
                </div>
                <div className="mini-lec">
                  <span className="ic">
                    <LockGlyph />
                  </span>
                  <span className="nm">Effects without the bugs</span>
                  <span className="du">17:48</span>
                </div>
              </div>
              <div className="cap">
                <b>Watch before you buy</b>
                <span>Instructors mark lectures as free previews. Everything else stays locked until you enroll.</span>
              </div>
            </div>
            <div className="tile t-b rise">
              <div className="el" data-ui aria-hidden="true">
                <span className="badge">
                  <span className="q" style={{ background: "#f0c27b", marginRight: ".15em" }} />
                  Enrolled
                </span>
              </div>
              <div className="cap">
                <b>Yours, marked</b>
                <span>The catalog flags every course you already own.</span>
              </div>
            </div>
            <div className="tile t-c rise">
              <div className="el" data-ui aria-hidden="true">
                <div className="search">
                  <svg viewBox="0 0 12 12">
                    <circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m8 8 3 3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  react hoo
                  <span className="cur" />
                </div>
              </div>
              <div className="cap">
                <b>Search as you type</b>
                <span>Titles, subtitles and categories.</span>
              </div>
            </div>
            <div className="tile t-d rise">
              <div className="el" data-ui aria-hidden="true">
                <div className="gbtn">Create account</div>
              </div>
              <div className="cap">
                <b>Sign up in a minute</b>
                <span>Name, email and password.</span>
              </div>
            </div>
            <div className="tile t-h">
              <h2 id="ft-title" className="rise">
                Built into every course
              </h2>
            </div>
            <div className="tile t-e rise">
              <div className="el" data-ui>
                {featured.total}
                <small>{featured.total === 1 ? "course" : "courses"} in the catalog right now</small>
              </div>
              <div className="cap">
                <b>Know your numbers</b>
                <span>Courses, published courses and students on your instructor dashboard.</span>
              </div>
            </div>
            <div className="tile t-f rise">
              <div className="el" data-ui aria-hidden="true">
                <div className="timer">
                  <span>Link expires in</span>
                  <b>59:12</b>
                </div>
              </div>
              <div className="url" data-ui aria-hidden="true">
                ik.imagekit.io/learnly/lec-03.mp4?ik-t=…
              </div>
              <div className="cap">
                <b>Links that expire</b>
                <span>Lecture videos are signed for one hour, so a copied link stops working.</span>
              </div>
            </div>
            <div className="tile t-g rise">
              <div className="el" data-ui>
                <Link className="chip on" href="/courses">
                  All
                </Link>
                {CATEGORIES.map((c) => (
                  <Link key={c} className="chip" href={`/courses?category=${encodeURIComponent(c)}`}>
                    {c}
                  </Link>
                ))}
              </div>
              <div className="cap">
                <b>Six categories</b>
                <span>From Web Development to Cloud &amp; DevOps.</span>
              </div>
            </div>
            <div className="tile t-i rise">
              <div className="el" data-ui aria-hidden="true">
                <span>₹</span>
                <span>$</span>
                <span>€</span>
              </div>
              <div className="cap">
                <b>Three currencies</b>
                <span>Price in INR, USD or EUR.</span>
              </div>
            </div>
            <div className="tile t-j rise">
              <div className="el" data-ui aria-hidden="true">
                <div className="upl">
                  <div className="row">
                    <b style={{ fontWeight: 500 }}>effects-without-bugs.mp4</b>
                    <span>62%</span>
                  </div>
                  <div className="bar">
                    <i />
                  </div>
                  <div className="meta">286 MB of 462 MB · uploading straight to ImageKit</div>
                </div>
              </div>
              <div className="cap">
                <b>Upload from your browser</b>
                <span>Videos up to 500 MB go straight to the media CDN, or paste a YouTube link instead.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="prices" id="prices" aria-labelledby="pr-title">
          <div className="steps">
            <h2 id="pr-title" className="rise">
              One button, three states
            </h2>
            <p className="sub rise">
              The purchase card on every course changes with you: free, paid or already yours. You are never charged twice for the same
              course.
            </p>
            <article className="plan rise">
              <h3>₹0</h3>
              <p className="kind">A free course</p>
              <ul>
                <li>No checkout at all</li>
                <li>Enrolled the moment you click</li>
              </ul>
              <Link className="strip" href="/courses">
                Enroll now
              </Link>
            </article>
            <article className="plan rise">
              <h3>₹1,499</h3>
              <p className="kind">A paid course</p>
              <ul>
                <li>Razorpay Checkout opens on the page</li>
                <li>The payment is verified on our server</li>
                <li>Then every lecture unlocks</li>
                <li>Priced in INR, USD or EUR</li>
              </ul>
              <Link className="strip" href="/courses">
                Buy now
              </Link>
            </article>
            <article className="plan rise">
              <h3>Enrolled</h3>
              <p className="kind">A course you already own</p>
              <ul>
                <li>Every lecture, free previews and the rest</li>
                <li>The course player, with the whole course beside the video</li>
                <li>Listed on your student dashboard</li>
                <li>Buying it again is blocked</li>
                <li>Yours for as long as your account is</li>
              </ul>
              <Link className="strip" href={user ? "/dashboard" : "/login?next=%2Fdashboard"}>
                Start course
              </Link>
            </article>
          </div>
          <p className="note">The prices above are examples of each state, not offers.</p>
        </section>

        <section className="faq g12" id="faq" aria-labelledby="faq-title">
          <div className="side">
            <h2 id="faq-title" className="rise">
              Questions, answered
            </h2>
            <p className="rise">Anything else, write to the instructor of the course you’re looking at.</p>
          </div>
          <div className="list">
            {FAQ.map((item, i) => (
              <details key={item.q} name="faq" open={i === 0} className="rise">
                <summary>
                  {item.q}
                  <span className="pm" aria-hidden="true" />
                </summary>
                <div className="ans">{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="cta" id="join" aria-labelledby="cta-title">
          <h2 id="cta-title" className="rise">
            Start learning today.
          </h2>
          {user ? (
            <div className="actions rise">
              <Link className="btn" href={dashboardHref}>
                Go to your dashboard
              </Link>
              <Link className="btn" href="/courses" style={{ background: "var(--surface-2)" }}>
                Browse courses
              </Link>
            </div>
          ) : (
            <>
              <form className="rise" action="/register" method="get">
                <label htmlFor="cta-email" className="sr-only">
                  Your email
                </label>
                <input id="cta-email" name="email" type="email" autoComplete="email" placeholder="you@mail.com" required />
                <button type="submit">Create account</button>
              </form>
              <p className="after rise">Free to join. Free courses open the moment you enroll.</p>
            </>
          )}
        </section>
      </main>
    </LandingRoot>
  );
}
