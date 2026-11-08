import { cache } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { PurchaseCard } from "@/components/purchase-card";
import { getCurrentUser } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";
import { getCourseDetails } from "@/lib/server/services/courses";
import { formatDuration } from "@/lib/shared/format";
import { getYouTubeId } from "@/lib/shared/video";

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

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PreviewPlayer({ lecture }) {
  const youtubeId = lecture.isExternal ? getYouTubeId(lecture.videoUrl) : null;
  if (youtubeId) {
    return (
      <iframe
        title={`Preview: ${lecture.lectureTitle}`}
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="fullscreen"
        allowFullScreen
        className="aspect-video w-full rounded-base bg-surface"
      />
    );
  }
  if (lecture.isExternal) {
    return (
      <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="text-t5 underline underline-offset-4">
        Open preview in a new tab
      </a>
    );
  }
  return (
    <video
      controls
      controlsList="nodownload"
      preload="metadata"
      aria-label={`Preview: ${lecture.lectureTitle}`}
      src={lecture.videoUrl}
      className="aspect-video w-full rounded-base bg-black"
    />
  );
}

export default async function CoursePage({ params }) {
  const { courseId } = await params;
  const { course, viewer } = await loadCourse(courseId);
  const previews = course.lectures.filter((l) => l.isPreviewFree && l.videoUrl);
  const totalSeconds = course.lectures.reduce((sum, l) => sum + l.duration, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-(--m) py-10">
      {!course.isPublished && (
        <p role="status" className="mb-6 rounded-base border border-t3 bg-t1 px-4 py-3 text-small">
          Draft — only you can see this course. Publish it from your dashboard to make it public.
        </p>
      )}

      <p className="text-small text-t5">{course.category}</p>
      <h1 className="mt-2 max-w-4xl text-5xl font-bold leading-tight tracking-tight">{course.courseTitle}</h1>
      {course.subTitle && <p className="mt-4 max-w-3xl text-lg text-muted">{course.subTitle}</p>}
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-muted">
        <span className="flex items-center gap-2">
          <Avatar name={course.creator.name} src={course.creator.photourl} size={24} />
          {course.creator.name}
        </span>
        <span>
          {course.enrolledCount} {course.enrolledCount === 1 ? "student" : "students"}
        </span>
        <span>
          {course.lectures.length} {course.lectures.length === 1 ? "lecture" : "lectures"}
        </span>
        {totalSeconds > 0 && <span>{formatDuration(totalSeconds)} total</span>}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          <div className="relative aspect-video overflow-hidden rounded-base bg-surface-2">
            <Image
              src={course.courseThumbnail}
              alt={`${course.courseTitle} thumbnail`}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>

          {course.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="text-2xl font-semibold">
                About this course
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-muted">{course.description}</p>
            </section>
          )}

          {previews.length > 0 && (
            <section aria-labelledby="preview" className="space-y-6">
              <h2 id="preview" className="text-2xl font-semibold">
                Free preview
              </h2>
              {previews.map((lecture) => (
                <div key={lecture.id} className="space-y-2">
                  <p className="text-small text-muted">{lecture.lectureTitle}</p>
                  <PreviewPlayer lecture={lecture} />
                </div>
              ))}
            </section>
          )}

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="text-2xl font-semibold">
              Curriculum
            </h2>
            {course.lectures.length === 0 ? (
              <p className="mt-4 text-muted">No lectures yet.</p>
            ) : (
              <ol className="mt-4 divide-y divide-surface-2 overflow-hidden rounded-base bg-surface">
                {course.lectures.map((lecture, i) => (
                  <li key={lecture.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-t5">
                        <span className="w-6 text-small text-muted">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{lecture.lectureTitle}</span>
                        {lecture.isPreviewFree ? (
                          <span className="rounded-full bg-t2 px-2 py-0.5 text-small">Free preview</span>
                        ) : (
                          !course.canAccess && (
                            <span className="text-muted" title="Locked">
                              <LockIcon />
                              <span className="sr-only">Locked</span>
                            </span>
                          )
                        )}
                        <span className="text-small tabular-nums text-muted">{formatDuration(lecture.duration)}</span>
                      </summary>
                      <p className="px-4 pb-4 pl-13 text-small text-muted">
                        {lecture.isPreviewFree
                          ? "Watch this lecture free in the preview above."
                          : course.canAccess
                            ? "Available in the course player."
                            : "Enroll to unlock this lecture."}
                      </p>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-labelledby="instructor" className="flex items-center gap-4 rounded-base bg-surface p-6">
            <Avatar name={course.creator.name} src={course.creator.photourl} size={56} />
            <div>
              <h2 id="instructor" className="text-small text-muted">
                Instructor
              </h2>
              <p className="text-xl font-semibold">{course.creator.name}</p>
            </div>
          </section>
        </div>

        <PurchaseCard
          courseId={course.id}
          price={course.price}
          signedIn={Boolean(viewer)}
          canAccess={course.canAccess}
          lectureCount={course.lectures.length}
        />
      </div>
    </main>
  );
}
