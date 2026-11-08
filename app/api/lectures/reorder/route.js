import { requireRole } from "@/lib/server/auth";
import { ok, parseBody, withErrors } from "@/lib/server/http";
import { applyArrangement, loadCurriculum, serializeSection } from "@/lib/server/services/curriculum";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { serializeOwnedLecture } from "@/lib/server/services/lectures";
import { reorderSchema } from "@/lib/server/validators/section";

export const runtime = "nodejs";

// One request carries the whole new arrangement, so a reorder is all-or-nothing and safe to retry.
export const POST = withErrors(async (req) => {
  const user = await requireRole(req, "instructor");
  const { courseId, sectionIds, groups } = await parseBody(reorderSchema, req);
  const course = await getOwnedCourse(courseId, user);
  await applyArrangement(course._id, { sectionIds, groups });
  const { sections, lectures } = await loadCurriculum(course._id);
  return ok({ sections: sections.map(serializeSection), lectures: lectures.map(serializeOwnedLecture) });
});
