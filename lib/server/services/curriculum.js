import { connectDb } from "@/lib/server/db";
import { HttpError, parseId } from "@/lib/server/http";
import { Lecture } from "@/models/lecture";
import { Section } from "@/models/section";

export const MAX_SECTIONS = 50;

// Missing positions (lectures from before sections existed) come first, then by position, then oldest first.
const byPosition = (a, b) => (a.position ?? -1) - (b.position ?? -1) || new Date(a.createdAt) - new Date(b.createdAt);

/**
 * Sections and lectures of a course in display order: each section (by position) with its lectures, then the
 * lectures that have no section. A lecture pointing at a section that no longer exists counts as unsectioned.
 * Every reader (course page, player, instructor list, lecture API) goes through this, so they always agree.
 */
export async function loadCurriculum(courseId) {
  await connectDb();
  const [sectionDocs, lectureDocs] = await Promise.all([Section.find({ courseId }).lean(), Lecture.find({ courseId }).lean()]);
  const sections = sectionDocs.sort(byPosition);
  const known = new Set(sections.map((s) => String(s._id)));
  const groupOf = (l) => (l.sectionId && known.has(String(l.sectionId)) ? String(l.sectionId) : null);

  const lectures = [];
  for (const s of sections) lectures.push(...lectureDocs.filter((l) => groupOf(l) === String(s._id)).sort(byPosition));
  lectures.push(...lectureDocs.filter((l) => groupOf(l) === null).sort(byPosition));
  return { sections, lectures };
}

export const serializeSection = (s) => ({ id: String(s._id), title: s.title });

/** Next free position at the end of a group (a section, or null for the unsectioned lectures). */
export async function nextLecturePosition(courseId, sectionId) {
  await connectDb();
  const group = await Lecture.find({ courseId, sectionId: sectionId ?? null }).select("position").lean();
  const positions = group.map((l) => l.position).filter((p) => typeof p === "number");
  return positions.length > 0 ? Math.max(...positions) + 1 : group.length;
}

/** A section id sent by a client must belong to the same course. */
export async function assertSectionInCourse(sectionId, courseId) {
  parseId(sectionId);
  await connectDb();
  const section = await Section.findOne({ _id: sectionId, courseId }).select("_id").lean();
  if (!section) throw new HttpError(400, "That section doesn’t belong to this course", { sectionId: ["Unknown section"] });
}

export async function getOwnedSection(sectionId, user, getOwnedCourse) {
  parseId(sectionId);
  await connectDb();
  const section = await Section.findById(sectionId);
  if (!section) throw new HttpError(404, "Section not found");
  await getOwnedCourse(String(section.courseId), user);
  return section;
}

/**
 * Applies a complete new arrangement in one go: the order of the sections, and for each group (a section id or
 * "none") the ordered lecture ids. It must mention every section and every lecture of the course exactly once,
 * otherwise the client was looking at stale data and gets a 409 instead of a half-applied change.
 */
export async function applyArrangement(courseId, { sectionIds, groups }) {
  await connectDb();
  const [sections, lectures] = await Promise.all([Section.find({ courseId }).select("_id").lean(), Lecture.find({ courseId }).select("_id").lean()]);
  const stale = () => new HttpError(409, "This course changed since you opened it. Reload the page and try again.");

  for (const id of [...sectionIds, ...Object.values(groups).flat()]) parseId(id);
  if (new Set(sectionIds).size !== sectionIds.length) throw new HttpError(400, "Duplicate section in the new order");
  const currentSections = new Set(sections.map((s) => String(s._id)));
  if (sectionIds.length !== currentSections.size || sectionIds.some((id) => !currentSections.has(id))) throw stale();

  for (const key of Object.keys(groups)) if (key !== "none" && !currentSections.has(key)) throw stale();
  const placed = Object.values(groups).flat();
  if (new Set(placed).size !== placed.length) throw new HttpError(400, "A lecture appears more than once");
  const currentLectures = new Set(lectures.map((l) => String(l._id)));
  if (placed.length !== currentLectures.size || placed.some((id) => !currentLectures.has(id))) throw stale();

  if (sectionIds.length > 0) {
    await Section.bulkWrite(sectionIds.map((id, position) => ({ updateOne: { filter: { _id: id }, update: { $set: { position } } } })));
  }
  const lectureOps = [];
  for (const [key, ids] of Object.entries(groups)) {
    ids.forEach((id, position) =>
      lectureOps.push({ updateOne: { filter: { _id: id }, update: { $set: { sectionId: key === "none" ? null : key, position } } } }),
    );
  }
  if (lectureOps.length > 0) await Lecture.bulkWrite(lectureOps);
}

/** Deleting a section keeps its lectures: they move to the end of the unsectioned group in their current order. */
export async function deleteSectionKeepingLectures(section) {
  await connectDb();
  const inside = (await Lecture.find({ courseId: section.courseId, sectionId: section._id }).lean()).sort(byPosition);
  const start = await nextLecturePosition(section.courseId, null);
  if (inside.length > 0) {
    await Lecture.bulkWrite(inside.map((l, i) => ({ updateOne: { filter: { _id: l._id }, update: { $set: { sectionId: null, position: start + i } } } })));
  }
  await section.deleteOne();
}
