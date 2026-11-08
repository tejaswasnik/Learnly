import { ok, withErrors } from "@/lib/server/http";
import { loadCurriculum, serializeSection } from "@/lib/server/services/curriculum";
import { requireEnrollment } from "@/lib/server/services/enrollment";
import { serializePlayableLecture } from "@/lib/server/services/lectures";
import { getProgress } from "@/lib/server/services/progress";

export const runtime = "nodejs";

export const GET = withErrors(async (req, { params }) => {
  const { courseId } = await params;
  const { user, course } = await requireEnrollment(req, courseId);
  const { sections, lectures } = await loadCurriculum(course._id);
  // null for the course's own instructor and admins: they are not enrolled, so there is nothing to track.
  const progress = await getProgress(user._id, course._id);
  return ok({ sections: sections.map(serializeSection), lectures: lectures.map(serializePlayableLecture), progress });
});
