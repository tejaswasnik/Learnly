import { connectDb } from "@/lib/server/db";
import { ok, withErrors } from "@/lib/server/http";
import { requireEnrollment } from "@/lib/server/services/enrollment";
import { serializePlayableLecture } from "@/lib/server/services/lectures";
import { Lecture } from "@/models/lecture";

export const runtime = "nodejs";

export const GET = withErrors(async (req, { params }) => {
  const { courseId } = await params;
  const { course } = await requireEnrollment(req, courseId);
  await connectDb();
  const lectures = await Lecture.find({ courseId: course._id }).sort({ createdAt: 1 }).lean();
  return ok({ lectures: lectures.map(serializePlayableLecture) });
});
