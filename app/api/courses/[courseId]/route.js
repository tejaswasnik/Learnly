import { getCurrentUser, requireRole } from "@/lib/server/auth";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { getCourseDetails } from "@/lib/server/services/courses";
import { deleteFile } from "@/lib/server/services/imagekit";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { Enrollment } from "@/models/enrollment";
import { Lecture } from "@/models/lecture";

export const runtime = "nodejs";

export const GET = withErrors(async (req, { params }) => {
  const { courseId } = await params;
  const viewer = await getCurrentUser(req);
  return ok({ course: await getCourseDetails(courseId, viewer) });
});

export const DELETE = withErrors(async (req, { params }) => {
  const user = await requireRole(req, "instructor");
  const { courseId } = await params;
  const course = await getOwnedCourse(courseId, user);

  // Never destroy something a student paid for.
  if (await Enrollment.exists({ courseId: course._id })) {
    throw new HttpError(409, "This course has students. Unpublish it instead.");
  }

  const lectures = await Lecture.find({ courseId: course._id }).select("fileId").lean();
  await Lecture.deleteMany({ courseId: course._id });
  await course.deleteOne();

  // Remove media after the records are gone; a failed delete is logged, never blocks the response.
  await Promise.all([...lectures.map((l) => deleteFile(l.fileId)), deleteFile(course.thumbnailFileId)]);

  return ok({ message: "Course deleted" });
});
