import { ok, withErrors } from "@/lib/server/http";
import { loadCurriculum, serializeSection } from "@/lib/server/services/curriculum";
import { requireEnrollment } from "@/lib/server/services/enrollment";
import { serializePlayableLecture } from "@/lib/server/services/lectures";

export const runtime = "nodejs";

export const GET = withErrors(async (req, { params }) => {
  const { courseId } = await params;
  const { course } = await requireEnrollment(req, courseId);
  const { sections, lectures } = await loadCurriculum(course._id);
  return ok({ sections: sections.map(serializeSection), lectures: lectures.map(serializePlayableLecture) });
});
