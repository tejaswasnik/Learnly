import { CoursePlayer } from "@/components/player/course-player";

export const metadata = { title: "Course player" };

export default async function LearnPage({ params }) {
  const { courseId } = await params;
  return <CoursePlayer courseId={courseId} />;
}
