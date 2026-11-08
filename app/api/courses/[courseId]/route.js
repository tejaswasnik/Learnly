import { getCurrentUser } from "@/lib/server/auth";
import { ok, withErrors } from "@/lib/server/http";
import { getCourseDetails } from "@/lib/server/services/courses";

export const runtime = "nodejs";

export const GET = withErrors(async (req, { params }) => {
  const { courseId } = await params;
  const viewer = await getCurrentUser(req);
  return ok({ course: await getCourseDetails(courseId, viewer) });
});
