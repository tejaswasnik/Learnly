import { requireRole } from "@/lib/server/auth";
import { ok, withErrors } from "@/lib/server/http";
import { listInstructorCourses } from "@/lib/server/services/instructor-courses";
import { instructorListQuerySchema } from "@/lib/server/validators/course";

export const runtime = "nodejs";

// Static "instructor" segment wins over the dynamic [courseId] sibling.
export const GET = withErrors(async (req) => {
  const user = await requireRole(req, "instructor");
  const query = instructorListQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listInstructorCourses(user, query));
});
