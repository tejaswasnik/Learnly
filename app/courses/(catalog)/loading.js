import { CourseGridSkeleton } from "@/components/course-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-(--m) py-10">
      <div className="mb-8 h-10 w-48 animate-pulse rounded bg-surface" />
      <CourseGridSkeleton />
    </main>
  );
}
