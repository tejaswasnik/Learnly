import { CatalogFilters } from "@/components/catalog-filters";
import { CourseCard } from "@/components/course-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
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

  const hrefFor = (p) => {
    const params = new URLSearchParams();
    if (clean.search) params.set("search", clean.search);
    if (clean.category) params.set("category", clean.category);
    if (clean.sort !== "newest") params.set("sort", clean.sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  const countLabel = `${total} ${total === 1 ? "course" : "courses"}${clean.search ? ` for “${clean.search}”` : ""}`;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-(--m) pb-24 pt-10 md:pt-16">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-4">
        <h1 className="text-display text-ink">Explore courses</h1>
        <p className="max-w-[520px] text-muted">Pick a course, buy it once, watch it whenever you like.</p>
      </header>

      <div className="mt-10 md:mt-12">
        <CatalogFilters search={clean.search ?? ""} category={clean.category ?? ""} sort={clean.sort} />
      </div>

      <section aria-labelledby="results-heading" className="mt-10 md:mt-12">
        <h2 id="results-heading" aria-live="polite" className="mb-6 text-muted">
          {countLabel}
        </h2>

        {courses.length === 0 ? (
          <div className="py-12">
            <EmptyState title="No courses match your filters" message="Try a different category or clear the search to see everything.">
              <ButtonLink href="/courses" variant="secondary">
                Clear filters
              </ButtonLink>
            </EmptyState>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} enrolled={enrolled.has(course.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12">
        <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </main>
  );
}
