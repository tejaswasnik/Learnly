import { requireRole } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { ok, parseBody, withErrors } from "@/lib/server/http";
import { assertSectionInCourse, nextLecturePosition } from "@/lib/server/services/curriculum";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { assertFileUnused, assertSafeFilePath, serializeOwnedLecture } from "@/lib/server/services/lectures";
import { createLectureSchema } from "@/lib/server/validators/lecture";
import { Lecture } from "@/models/lecture";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const user = await requireRole(req, "instructor");
  const data = await parseBody(createLectureSchema, req);
  const course = await getOwnedCourse(data.courseId, user);

  if (data.fileId) {
    assertSafeFilePath(data.filePath);
    await assertFileUnused(data.fileId);
  }

  const sectionId = data.sectionId ?? null;
  if (sectionId) await assertSectionInCourse(sectionId, course._id);

  await connectDb();
  const lecture = await Lecture.create({
    courseId: course._id,
    sectionId,
    position: await nextLecturePosition(course._id, sectionId),
    lectureTitle: data.lectureTitle,
    description: data.description || undefined,
    duration: data.duration,
    isPreviewFree: data.isPreviewFree,
    ...(data.fileId ? { fileId: data.fileId, filePath: data.filePath } : { videoUrl: data.videoUrl }),
  });
  return ok({ lecture: serializeOwnedLecture(lecture) }, { status: 201 });
});
