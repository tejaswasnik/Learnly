import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

export function EnrolledCourseCard({ course, progress }) {
  const percent = progress?.percent ?? 0;
  const label = percent === 0 ? "Start course" : percent >= 100 ? "Watch again" : "Continue";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-base bg-surface">
      <div className="relative aspect-video w-full overflow-hidden bg-t1">
        <Image src={course.courseThumbnail} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-caption text-muted">{course.category}</p>
        <h3 className="line-clamp-2 min-h-[54px] font-semibold">{course.courseTitle}</h3>
        <p className="text-small text-muted">{course.creator.name}</p>
        {progress && progress.lectureCount > 0 && (
          <div className="flex flex-col gap-1 pt-1">
            <ProgressBar percent={percent} label={`${course.courseTitle} progress`} />
            <p className="text-small text-muted">
              {progress.completedCount} of {progress.lectureCount} lectures · {percent}%
            </p>
          </div>
        )}
        <div className="mt-auto pt-1">
          <ButtonLink href={`/learn/${course.id}`} fullWidth leadingIcon="continue" aria-label={`${label}: ${course.courseTitle}`}>
            {label}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
