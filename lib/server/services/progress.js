import { connectDb } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { Enrollment } from "@/models/enrollment";
import { Lecture } from "@/models/lecture";

/**
 * Progress as the student should see it, measured against the lectures that exist now: completed ids of deleted
 * lectures are ignored, and a course that gained lectures since shows a lower percentage.
 */
export function summarizeProgress(enrollment, lectureIds) {
  const existing = new Set(lectureIds.map(String));
  const completed = [...new Set((enrollment.completedLectureIds ?? []).map(String))].filter((id) => existing.has(id));
  const last = enrollment.lastLectureId && existing.has(String(enrollment.lastLectureId)) ? String(enrollment.lastLectureId) : null;
  return {
    completedLectureIds: completed,
    lastLectureId: last,
    completedCount: completed.length,
    lectureCount: existing.size,
    percent: existing.size > 0 ? Math.round((completed.length / existing.size) * 100) : 0,
  };
}

const lectureIdsOf = async (courseId) => (await Lecture.find({ courseId }).select("_id").lean()).map((l) => l._id);

/** The signed-in student's progress in one course, or null when they have no enrollment (owners and admins). */
export async function getProgress(userId, courseId) {
  await connectDb();
  const enrollment = await Enrollment.findOne({ userId, courseId }).lean();
  return enrollment ? summarizeProgress(enrollment, await lectureIdsOf(courseId)) : null;
}

/** Progress for many enrollments at once (the dashboard): one lecture query for all courses, no N+1. */
export async function progressForEnrollments(enrollments) {
  const courseIds = [...new Set(enrollments.map((e) => String(e.courseId?._id ?? e.courseId)))];
  const lectures = await Lecture.find({ courseId: { $in: courseIds } }).select("_id courseId").lean();
  const byCourse = new Map();
  for (const l of lectures) {
    const key = String(l.courseId);
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key).push(l._id);
  }
  return new Map(enrollments.map((e) => [String(e._id), summarizeProgress(e, byCourse.get(String(e.courseId?._id ?? e.courseId)) ?? [])]));
}

/**
 * Marks a lecture done or not done (completed) and/or records it as the one being watched (viewing). The lecture
 * must belong to the course. Atomic set operations, so two tabs cannot overwrite each other with a stale list.
 */
export async function updateProgress({ userId, courseId, lectureId, completed, viewing }) {
  await connectDb();
  const enrollment = await Enrollment.findOne({ userId, courseId }).select("_id").lean();
  if (!enrollment) throw new HttpError(403, "Only enrolled students have progress to save");
  if (!(await Lecture.exists({ _id: lectureId, courseId }))) throw new HttpError(404, "Lecture not found in this course");

  const update = {};
  if (completed === true) update.$addToSet = { completedLectureIds: lectureId };
  if (completed === false) update.$pull = { completedLectureIds: lectureId };
  if (viewing) update.$set = { lastLectureId: lectureId };
  const fresh = await Enrollment.findOneAndUpdate({ _id: enrollment._id }, update, { returnDocument: "after" }).lean();

  const summary = summarizeProgress(fresh, await lectureIdsOf(courseId));
  if (summary.percent !== fresh.progress) await Enrollment.updateOne({ _id: enrollment._id }, { $set: { progress: summary.percent } });
  return summary;
}
