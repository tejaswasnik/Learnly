import Link from "next/link";
import { CatalogFilters } from "@/components/catalog-filters";
import { CourseCard } from "@/components/course-card";
import { getCurrentUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { listPublishedCourses } from "@/lib/server/services/courses";
import { catalogQuerySchema } from "@/lib/server/validators/catalog";
import { Enrollment } from "@/models/enrollment";

export const metadata = {
  title: "Courses",
  description: "Browse video courses from Learnly instructors.",
};

function firstValues(params) {
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

async function enrolledIdsFor(user, courses) {
  if (!user || courses.length === 0) return new Set();
  await connectDb();
  const rows = await Enrollment.find({ userId: user._id, courseId: { $in: courses.map((c) => c.id) } })
    .select("courseId")
    .lean();
  return new Set(rows.map((r) => String(r.courseId)));
}

export default async function CoursesPage({ searchParams }) {
  // Invalid query values fall back to defaults (keeping the search text) instead of failing the page.
  const raw = firstValues(await searchParams);
  const parsed = catalogQuerySchema.safeParse(raw);
  const clean = parsed.success
    ? parsed.data
    : catalogQuerySchema.parse({ search: typeof raw.search === "string" ? raw.search.slice(0, 100) : undefined });

  const [{ courses, page, totalPages, total }, user] = await Promise.all([
    listPublishedCourses(clean),
    getCurrentUser(),
  ]);
  const enrolled = await enrolledIdsFor(user, courses);

  const pageHref = (p) => {
    const params = new URLSearchParams();
    if (clean.search) params.set("search", clean.search);
    if (clean.category) params.set("category", clean.category);
    if (clean.sort !== "newest") params.set("sort", clean.sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-(--m) py-10">
      <h1 className="text-5xl font-bold tracking-tight">Courses</h1>
      <p className="mt-2 text-muted">
        {total} {total === 1 ? "course" : "courses"}
        {clean.search ? ` for “${clean.search}”` : ""}
      </p>

      <div className="mt-8">
        <CatalogFilters search={clean.search ?? ""} category={clean.category ?? ""} sort={clean.sort} />
      </div>

      {courses.length === 0 ? (
        <p className="mt-16 text-center text-muted">No courses match your filters.</p>
      ) : (
        <ul className="mt-8 grid gap-(--gap) sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <li key={course.id} className="flex">
              <div className="flex w-full flex-col [&>a]:flex-1">
                <CourseCard course={course} enrolled={enrolled.has(course.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded-base bg-surface px-4 py-2 text-small hover:bg-surface-2">
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={`rounded-base px-4 py-2 text-small ${p === page ? "bg-accent text-accent-ink" : "bg-surface hover:bg-surface-2"}`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="rounded-base bg-surface px-4 py-2 text-small hover:bg-surface-2">
              Next
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
