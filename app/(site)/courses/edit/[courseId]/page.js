import { EditCourse } from "@/components/instructor/edit-course";

export const metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }) {
  const { courseId } = await params;
  return <EditCourse courseId={courseId} />;
}
