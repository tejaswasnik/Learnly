import { ok, parseBody, withErrors } from "@/lib/server/http";
import { requireEnrollment } from "@/lib/server/services/enrollment";
import { assertCanPost, createPost, getLectureOr404, listQuestions } from "@/lib/server/services/qna";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { postBodySchema } from "@/lib/server/validators/qna";

export const runtime = "nodejs";

// Enrolled students, the course's instructor and admins can read and ask; nobody else gets in.
export const GET = withErrors(async (req, { params }) => {
  const { lectureId } = await params;
  const lecture = await getLectureOr404(lectureId);
  const { user } = await requireEnrollment(req, String(lecture.courseId));
  const page = Math.max(1, Number.parseInt(new URL(req.url).searchParams.get("page") ?? "1", 10) || 1);
  return ok(await listQuestions({ lectureId: lecture._id, courseId: lecture.courseId, viewer: user, page }));
});

export const POST = withRateLimit([{ name: "qna-question", limit: 30, windowMs: HOUR, by: "user" }], async (req, { params }) => {
  const { lectureId } = await params;
  const lecture = await getLectureOr404(lectureId);
  const { user } = await requireEnrollment(req, String(lecture.courseId));
  assertCanPost(user);
  const { body } = await parseBody(postBodySchema, req);
  return ok({ question: await createPost({ user, lecture: { _id: lecture._id, courseId: lecture.courseId }, body }) }, { status: 201 });
});
