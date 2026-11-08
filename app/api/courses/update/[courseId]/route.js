import { VERIFY_FIRST_MESSAGE, requireRole } from "@/lib/server/auth";
import { readMultipart } from "@/lib/server/form";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { deleteFile, uploadImage } from "@/lib/server/services/imagekit";
import { getOwnedCourse, serializeOwnedCourse } from "@/lib/server/services/instructor-courses";
import { updateCourseSchema } from "@/lib/server/validators/course";
import { validateImageFile } from "@/lib/server/validators/image";
import { Lecture } from "@/models/lecture";

export const runtime = "nodejs";

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireRole(req, "instructor");
  const { courseId } = await params;
  const course = await getOwnedCourse(courseId, user);

  const { fields, file } = await readMultipart(req, "courseThumbnail");
  const data = updateCourseSchema.parse(fields);
  const image = file ? await validateImageFile(file) : null;

  if (data.isPublished === true && !course.isPublished) {
    if (!user.emailVerified && user.role !== "admin") throw new HttpError(403, VERIFY_FIRST_MESSAGE);
    const lectureCount = await Lecture.countDocuments({ courseId: course._id });
    if (lectureCount === 0) throw new HttpError(409, "Add at least one lecture before publishing this course");
  }

  if (data.courseTitle !== undefined) course.courseTitle = data.courseTitle;
  if (data.category !== undefined) course.category = data.category;
  // "" is a real value here: it clears the field.
  if (data.subTitle !== undefined) course.subTitle = data.subTitle === "" ? undefined : data.subTitle;
  if (data.description !== undefined) course.description = data.description === "" ? undefined : data.description;
  if (data.price !== undefined) course.price.amount = data.price;
  if (data.currency !== undefined) course.price.currency = data.currency;
  if (data.isPublished !== undefined) course.isPublished = data.isPublished;

  let oldFileId;
  let newFileId;
  if (image) {
    const uploaded = await uploadImage(image, "courses");
    oldFileId = course.thumbnailFileId;
    newFileId = uploaded.fileId;
    course.courseThumbnail = uploaded.url;
    course.thumbnailFileId = uploaded.fileId;
  }

  try {
    await course.save();
  } catch (err) {
    await deleteFile(newFileId);
    throw err;
  }
  await deleteFile(oldFileId); // only after the new one is safely saved

  return ok({ course: serializeOwnedCourse(course) });
});
