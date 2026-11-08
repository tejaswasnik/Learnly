import { requireVerified } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { readMultipart } from "@/lib/server/form";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { deleteFile, uploadImage } from "@/lib/server/services/imagekit";
import { serializeOwnedCourse } from "@/lib/server/services/instructor-courses";
import { createCourseSchema } from "@/lib/server/validators/course";
import { validateImageFile } from "@/lib/server/validators/image";
import { Course } from "@/models/course";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const user = await requireVerified(req, "instructor");
  const { fields, file } = await readMultipart(req, "courseThumbnail");

  const data = createCourseSchema.parse(fields);
  if (!file) throw new HttpError(400, "A course thumbnail is required", { courseThumbnail: ["Thumbnail is required"] });
  const image = await validateImageFile(file);

  await connectDb();
  const { url, fileId } = await uploadImage(image, "courses");
  try {
    const course = await Course.create({
      courseTitle: data.courseTitle,
      subTitle: data.subTitle || undefined,
      description: data.description || undefined,
      category: data.category,
      price: { amount: data.price, currency: data.currency },
      courseThumbnail: url,
      thumbnailFileId: fileId,
      creator: user._id,
      isPublished: false,
    });
    return ok({ course: serializeOwnedCourse(course, { enrolledCount: 0, lectureCount: 0 }) }, { status: 201 });
  } catch (err) {
    await deleteFile(fileId); // do not leave an orphaned upload behind
    throw err;
  }
});
