import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/shared/format";

export function CourseCard({ course, enrolled = false }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex h-full flex-col overflow-hidden rounded-base bg-surface transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-t1">
        <Image
          src={course.courseThumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {enrolled && <Badge variant="enrolled" className="absolute bottom-3 left-3" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-caption text-muted">{course.category}</p>
        <h3 className="line-clamp-2 font-semibold">{course.courseTitle}</h3>
        <p className="text-small text-muted">{course.creator.name}</p>
        <p className="mt-auto font-semibold">{formatPrice(course.price.amount, course.price.currency)}</p>
      </div>
    </Link>
  );
}
