import { requireRole } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseBody, withErrors } from "@/lib/server/http";
import { MAX_SECTIONS, serializeSection } from "@/lib/server/services/curriculum";
import { getOwnedCourse } from "@/lib/server/services/instructor-courses";
import { createSectionSchema } from "@/lib/server/validators/section";
import { Section } from "@/models/section";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const user = await requireRole(req, "instructor");
  const { courseId, title } = await parseBody(createSectionSchema, req);
  const course = await getOwnedCourse(courseId, user);
  await connectDb();

  const existing = await Section.find({ courseId: course._id }).select("position").lean();
  if (existing.length >= MAX_SECTIONS) throw new HttpError(409, `A course can have at most ${MAX_SECTIONS} sections`);
  const position = existing.length > 0 ? Math.max(...existing.map((s) => s.position ?? 0)) + 1 : 0;

  const section = await Section.create({ courseId: course._id, title, position });
  return ok({ section: serializeSection(section) }, { status: 201 });
});
