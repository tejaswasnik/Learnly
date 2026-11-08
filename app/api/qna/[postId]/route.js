import { requireUser } from "@/lib/server/auth";
import { ok, withErrors } from "@/lib/server/http";
import { deletePost } from "@/lib/server/services/qna";

export const runtime = "nodejs";

export const DELETE = withErrors(async (req, { params }) => {
  const user = await requireUser(req);
  const { postId } = await params;
  await deletePost({ postId, viewer: user });
  return ok({ message: "Deleted" });
});
