import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "My learning", href: "/dashboard" },
    ],
  },
  {
    title: "Teach",
    links: [
      { label: "Become an instructor", href: "/register" },
      { label: "Instructor dashboard", href: "/instructor/dashboard" },
    ],
  },
];

const linkClass =
  "inline-flex min-h-11 items-center rounded-xs text-small text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-light md:min-h-0";

export function Footer() {
  return (
    <footer className="bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-(--m) pb-8 pt-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between md:gap-16">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-[300px] text-small text-muted">Learn from people who ship real work. Pay once, watch every lecture.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h2 className="font-semibold">{col.title}</h2>
                <ul className="flex flex-col gap-3 md:gap-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-2 text-small text-muted sm:flex-row sm:justify-between">
          <p>© 2026 Learnly. All rights reserved.</p>
          <p>Prices in INR and include GST.</p>
        </div>
      </div>
    </footer>
  );
}
