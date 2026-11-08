import { publicUser, requireUser } from "@/lib/server/auth";
import { ok, parseBody, withErrors } from "@/lib/server/http";
import { updateNameSchema } from "@/lib/server/validators/user";

export const runtime = "nodejs";

export const PATCH = withErrors(async (req) => {
  const user = await requireUser(req);
  const { name } = await parseBody(updateNameSchema, req);
  user.name = name;
  await user.save();
  return ok({ user: publicUser(user) });
});
