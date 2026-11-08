import { LectureList } from "@/components/instructor/lecture-list";

export const metadata = { title: "Lectures" };

export default async function LecturesPage({ params }) {
  const { courseId } = await params;
  return <LectureList courseId={courseId} />;
}
