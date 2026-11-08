import { publicUser, requireUser } from "@/lib/server/auth";
import { ok, withErrors } from "@/lib/server/http";
import { removeAvatar } from "@/lib/server/services/avatar";

export const runtime = "nodejs";

export const DELETE = withErrors(async (req) => {
  const user = await requireUser(req);
  await removeAvatar(user);
  return ok({ user: publicUser(user) });
});
