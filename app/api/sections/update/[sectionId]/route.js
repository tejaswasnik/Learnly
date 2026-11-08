import { requireRole } from "@/lib/server/auth";
import { ok, parseBody, withErrors } from "@/lib/server/http";
import { getOwnedSection, serializeSection } from "@/lib/server/services/curriculum";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { updateSectionSchema } from "@/lib/server/validators/section";

export const runtime = "nodejs";

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireRole(req, "instructor");
  const { sectionId } = await params;
  const section = await getOwnedSection(sectionId, user, getOwnedCourse);
  const { title } = await parseBody(updateSectionSchema, req);
  section.title = title;
  await section.save();
  return ok({ section: serializeSection(section) });
});
