import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CourseMedia } from "@/components/course/course-media";
import { Curriculum } from "@/components/course/curriculum";
import { PreviewProvider } from "@/components/course/preview-context";
import { PurchaseCard } from "@/components/purchase-card";
import { getCurrentUser } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";
import { getCourseDetails } from "@/lib/server/services/courses";
import { formatTotalLength } from "@/lib/shared/format";

const loadCourse = cache(async (courseId) => {
  const viewer = await getCurrentUser();
  try {
    return { course: await getCourseDetails(courseId, viewer), viewer };
  } catch (err) {
    if (err instanceof HttpError) notFound();
    throw err;
  }
});

export async function generateMetadata({ params }) {
  const { courseId } = await params;
  const { course } = await loadCourse(courseId);
  const description = course.subTitle || course.description.slice(0, 160) || `A ${course.category} course on Learnly.`;
  return {
    title: course.courseTitle,
    description,
    openGraph: { title: course.courseTitle, description, images: [course.courseThumbnail], type: "website" },
  };
}

const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export default async function CoursePage({ params }) {
  const { courseId } = await params;
  const { course, viewer } = await loadCourse(courseId);
  const totalSeconds = course.lectures.reduce((sum, l) => sum + l.duration, 0);
  const lectureCount = course.lectures.length;
  const paragraphs = course.description.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);

  const meta = [
    `Last updated ${monthYear.format(new Date(course.updatedAt))}`,
    `${lectureCount} ${lectureCount === 1 ? "lecture" : "lectures"}`,
    totalSeconds > 0 ? formatTotalLength(totalSeconds) : null,
  ].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-(--m) pb-24 pt-8 md:pt-12">
      {!course.isPublished && (
        <p role="status" className="mb-8 rounded-base bg-danger-tint px-4 py-3 font-semibold">
          Draft: only you can see this course. Publish it from your dashboard to add it to the catalog.
        </p>
      )}

      <PreviewProvider>
        <div className="grid gap-x-6 gap-y-12 lg:grid-cols-[minmax(0,1fr)_443px] lg:gap-y-16">
          <header className="flex flex-col items-start gap-6 lg:col-start-1">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-muted">
                <li>
                  <Link href="/courses" className="rounded-xs hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-light">
                    Courses
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/courses?category=${encodeURIComponent(course.category)}`}
                    className="rounded-xs hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-light"
                  >
                    {course.category}
                  </Link>
                </li>
              </ol>
            </nav>
            <span className="inline-flex h-11 items-center rounded-full bg-surface-2 px-4 text-small">{course.category}</span>
            <h1 className="text-h1 text-ink">{course.courseTitle}</h1>
            {course.subTitle && <p className="text-ink">{course.subTitle}</p>}
            <p className="flex items-center gap-3 font-semibold">
              <Avatar name={course.creator.name} photourl={course.creator.photourl} size="md" />
              {course.creator.name}
            </p>
            <p className="text-muted">{meta.join(" · ")}</p>
          </header>

          <div className="max-lg:order-2 lg:col-start-1">
            <CourseMedia course={course} />
          </div>

          {paragraphs.length > 0 && (
            <section aria-labelledby="about" className="flex flex-col gap-4 max-lg:order-2 lg:col-start-1">
              <h2 id="about" className="text-h2 text-ink">
                About this course
              </h2>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          )}

          <div className="max-lg:order-2 lg:col-start-1">
            <Curriculum course={course} />
          </div>

          <section aria-labelledby="instructor" className="flex flex-col gap-6 rounded-card bg-surface p-6 max-lg:order-2 md:p-8 lg:col-start-1">
            <h2 id="instructor" className="text-h2 text-ink">
              Your instructor
            </h2>
            <div className="flex items-center gap-4">
              <Avatar name={course.creator.name} photourl={course.creator.photourl} size="lg" />
              <p className="font-semibold">{course.creator.name}</p>
            </div>
          </section>

          <div className="max-lg:order-1 lg:col-start-2 lg:row-span-6 lg:row-start-1">
            <PurchaseCard
              courseId={course.id}
              title={course.courseTitle}
              thumbnail={course.courseThumbnail}
              price={course.price}
              signedIn={Boolean(viewer)}
              canAccess={course.canAccess}
              lectureCount={lectureCount}
              totalSeconds={totalSeconds}
            />
          </div>
        </div>
      </PreviewProvider>
    </main>
  );
}
