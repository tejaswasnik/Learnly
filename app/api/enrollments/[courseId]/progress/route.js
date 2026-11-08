import { requireUser } from "@/lib/server/auth";
import { ok, parseBody, parseId, withErrors } from "@/lib/server/http";
import { updateProgress } from "@/lib/server/services/progress";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { progressSchema } from "@/lib/server/validators/progress";

export const runtime = "nodejs";

// The player calls this when a lecture is ticked, finishes, or becomes the current one, so the ceiling is generous.
export const PATCH = withRateLimit([{ name: "progress", limit: 600, windowMs: HOUR, by: "user" }], async (req, { params }) => {
  const user = await requireUser(req);
  const { courseId } = await params;
  parseId(courseId);
  const { lectureId, completed, viewing } = await parseBody(progressSchema, req);
  parseId(lectureId);
  const progress = await updateProgress({ userId: user._id, courseId, lectureId, completed, viewing });
  return ok({ progress });
});
