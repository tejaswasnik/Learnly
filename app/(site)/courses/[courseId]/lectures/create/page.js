import { LectureFormLoader } from "@/components/instructor/lecture-form-loader";

export const metadata = { title: "Add lecture" };

export default async function CreateLecturePage({ params }) {
  const { courseId } = await params;
  return <LectureFormLoader courseId={courseId} />;
}
