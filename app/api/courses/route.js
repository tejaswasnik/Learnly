import { ok, withErrors } from "@/lib/server/http";
import { listPublishedCourses } from "@/lib/server/services/courses";
import { catalogQuerySchema } from "@/lib/server/validators/catalog";

export const runtime = "nodejs";

export const GET = withErrors(async (req) => {
  const query = catalogQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listPublishedCourses(query));
});
