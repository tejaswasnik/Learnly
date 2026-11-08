import { getCurrentUser, requireRole } from "@/lib/server/auth";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { getCourseDetails } from "@/lib/server/services/courses";
import { deleteCourseWithMedia, getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { Enrollment } from "@/models/enrollment";

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

  await deleteCourseWithMedia(course);

  return ok({ message: "Course deleted" });
});
