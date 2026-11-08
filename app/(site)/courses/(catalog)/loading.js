import { CourseGridSkeleton } from "@/components/course-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-(--m) pb-24 pt-10 md:pt-16" aria-busy="true">
      <h1 className="text-display text-ink">Explore courses</h1>
      <p className="mb-12 mt-8 text-muted">Loading courses</p>
      <CourseGridSkeleton />
    </main>
  );
}
