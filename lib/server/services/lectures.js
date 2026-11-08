import { connectDb } from "@/lib/server/db";
import { HttpError, parseId } from "@/lib/server/http";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { signedUrl } from "@/lib/server/services/imagekit";
import { Lecture } from "@/models/lecture";

export const SIGNED_URL_SECONDS = 3600;

/**
 * Lecture with a playable URL. Call this only after an enrollment/ownership check:
 * uploaded files get a signed URL that expires in an hour; external links are returned as they are.
 */
export function serializePlayableLecture(lecture) {
  const isExternal = !lecture.fileId;
  return {
    id: String(lecture._id),
    courseId: String(lecture.courseId),
    sectionId: lecture.sectionId ? String(lecture.sectionId) : null,
    lectureTitle: lecture.lectureTitle,
    description: lecture.description ?? "",
    duration: lecture.duration,
    isPreviewFree: lecture.isPreviewFree,
    isExternal,
    videoUrl: isExternal ? lecture.videoUrl : signedUrl(lecture.filePath, SIGNED_URL_SECONDS),
    videoUrlExpiresAt: isExternal ? null : new Date(Date.now() + SIGNED_URL_SECONDS * 1000).toISOString(),
  };
}

/** Lecture as shown to its owner (no signed URL, but the source so the edit form can show it). */
export function serializeOwnedLecture(lecture) {
  return {
    id: String(lecture._id),
    courseId: String(lecture.courseId),
    sectionId: lecture.sectionId ? String(lecture.sectionId) : null,
    lectureTitle: lecture.lectureTitle,
    description: lecture.description ?? "",
    duration: lecture.duration,
    isPreviewFree: lecture.isPreviewFree,
    isExternal: !lecture.fileId,
    videoUrl: lecture.fileId ? null : lecture.videoUrl,
    createdAt: lecture.createdAt.toISOString(),
  };
}

/** Loads a lecture and its course for an owner-only action: 404 if missing, 403 if the course is someone else's. */
export async function getOwnedLecture(lectureId, user) {
  parseId(lectureId);
  await connectDb();
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new HttpError(404, "Lecture not found");
  await getOwnedCourse(String(lecture.courseId), user);
  return lecture;
}

/** An uploaded file may belong to only one lecture, otherwise deleting one lecture could destroy another's video. */
export async function assertFileUnused(fileId, exceptLectureId) {
  const filter = { fileId };
  if (exceptLectureId) filter._id = { $ne: exceptLectureId };
  if (await Lecture.exists(filter)) throw new HttpError(409, "This uploaded file is already used by another lecture");
}

export function assertSafeFilePath(filePath) {
  if (!filePath.startsWith("/") || filePath.includes("..") || filePath.includes("?")) {
    throw new HttpError(400, "Invalid file path", { filePath: ["Invalid file path"] });
  }
}
