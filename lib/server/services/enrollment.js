import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { HttpError, parseId } from "@/lib/server/http";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";

export async function isEnrolled(userId, courseId) {
  await connectDb();
  return Boolean(await Enrollment.exists({ userId, courseId }));
}

/**
 * Gate for anything that returns playable lecture URLs: the user must be signed in AND
 * (enrolled OR the course creator OR an admin). Returns { user, course }.
 * 401 if signed out, 404 if the course does not exist, 403 otherwise.
 */
export async function requireEnrollment(req, courseId) {
  const user = await requireUser(req);
  parseId(courseId);
  await connectDb();

  const course = await Course.findById(courseId).select("creator isPublished").lean();
  if (!course) throw new HttpError(404, "Course not found");

  const isOwner = String(course.creator) === String(user._id);
  if (isOwner || user.role === "admin") return { user, course };
  if (await isEnrolled(user._id, course._id)) return { user, course };
  throw new HttpError(403, "Enroll in this course to watch its lectures");
}
