import { ok, parseBody } from "@/lib/server/http";
import { requireEnrollment } from "@/lib/server/services/enrollment";
import { assertCanPost, createPost, getQuestionOr404 } from "@/lib/server/services/qna";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { postBodySchema } from "@/lib/server/validators/qna";

export const runtime = "nodejs";

export const POST = withRateLimit([{ name: "qna-reply", limit: 60, windowMs: HOUR, by: "user" }], async (req, { params }) => {
  const { postId } = await params;
  const { question, lecture } = await getQuestionOr404(postId);
  const { user } = await requireEnrollment(req, String(lecture.courseId));
  assertCanPost(user);
  const { body } = await parseBody(postBodySchema, req);
  const reply = await createPost({ user, lecture: { _id: question.lectureId, courseId: question.courseId }, parentId: question._id, body });
  return ok({ reply }, { status: 201 });
});
