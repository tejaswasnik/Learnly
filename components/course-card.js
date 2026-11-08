import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/avatar";
import { formatPrice } from "@/lib/shared/format";

export function CourseCard({ course, enrolled = false }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-base bg-surface transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t5"
    >
      <div className="relative aspect-video bg-surface-2">
        <Image
          src={course.courseThumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {enrolled && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-small font-medium text-accent-ink">
            ★ Enrolled
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-small text-t5">{course.category}</p>
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{course.courseTitle}</h3>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="flex min-w-0 items-center gap-2 text-small text-muted">
            <Avatar name={course.creator.name} src={course.creator.photourl} size={24} />
            <span className="truncate">{course.creator.name}</span>
          </span>
          <span className="shrink-0 font-semibold">{formatPrice(course.price.amount, course.price.currency)}</span>
        </div>
      </div>
    </Link>
  );
}
