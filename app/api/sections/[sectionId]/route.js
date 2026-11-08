import { requireRole } from "@/lib/server/auth";
import { ok, withErrors } from "@/lib/server/http";
import { deleteSectionKeepingLectures, getOwnedSection } from "@/lib/server/services/curriculum";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";

export const runtime = "nodejs";

// The section goes; its lectures stay in the course (unsectioned, at the end). Nothing a student can watch is lost.
export const DELETE = withErrors(async (req, { params }) => {
  const user = await requireRole(req, "instructor");
  const { sectionId } = await params;
  const section = await getOwnedSection(sectionId, user, getOwnedCourse);
  await deleteSectionKeepingLectures(section);
  return ok({ message: "Section deleted. Its lectures were kept." });
});
