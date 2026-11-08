import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

export function EnrolledCourseCard({ course }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-base bg-surface">
      <div className="relative aspect-video w-full overflow-hidden bg-t1">
        <Image src={course.courseThumbnail} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-caption text-muted">{course.category}</p>
        <h3 className="line-clamp-2 min-h-[54px] font-semibold">{course.courseTitle}</h3>
        <p className="text-small text-muted">{course.creator.name}</p>
        <div className="mt-auto pt-1">
          <ButtonLink href={`/learn/${course.id}`} fullWidth leadingIcon="continue" aria-label={`Continue ${course.courseTitle}`}>
            Continue
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
