import { ok, withErrors } from "@/lib/server/http";
import { publicUser, requireUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export const GET = withErrors(async (req) => {
  const user = await requireUser(req);
  return ok({ user: publicUser(user) });
});
