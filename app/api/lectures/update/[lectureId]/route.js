import { requireRole } from "@/lib/server/auth";
import { ok, parseBody, withErrors } from "@/lib/server/http";
import { deleteFile } from "@/lib/server/services/imagekit";
import { assertFileUnused, assertSafeFilePath, getOwnedLecture, serializeOwnedLecture } from "@/lib/server/services/lectures";
import { updateLectureSchema } from "@/lib/server/validators/lecture";

export const runtime = "nodejs";

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireRole(req, "instructor");
  const { lectureId } = await params;
  const lecture = await getOwnedLecture(lectureId, user);
  const data = await parseBody(updateLectureSchema, req);

  if (data.lectureTitle !== undefined) lecture.lectureTitle = data.lectureTitle;
  if (data.description !== undefined) lecture.description = data.description === "" ? undefined : data.description;
  if (data.duration !== undefined) lecture.duration = data.duration;
  if (data.isPreviewFree !== undefined) lecture.isPreviewFree = data.isPreviewFree;

  // Swapping the video: exactly one source is kept, and a replaced upload is deleted after the save succeeds.
  let orphanedFileId;
  if (data.fileId) {
    assertSafeFilePath(data.filePath);
    await assertFileUnused(data.fileId, lecture._id);
    if (lecture.fileId && lecture.fileId !== data.fileId) orphanedFileId = lecture.fileId;
    lecture.fileId = data.fileId;
    lecture.filePath = data.filePath;
    lecture.videoUrl = undefined;
  } else if (data.videoUrl) {
    if (lecture.fileId) orphanedFileId = lecture.fileId;
    lecture.videoUrl = data.videoUrl;
    lecture.fileId = undefined;
    lecture.filePath = undefined;
  }

  await lecture.save();
  await deleteFile(orphanedFileId);
  return ok({ lecture: serializeOwnedLecture(lecture) });
});
