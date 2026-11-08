import { LectureFormLoader } from "@/components/instructor/lecture-form-loader";

export const metadata = { title: "Edit lecture" };

export default async function EditLecturePage({ params }) {
  const { courseId, lectureId } = await params;
  return <LectureFormLoader courseId={courseId} lectureId={lectureId} />;
}
