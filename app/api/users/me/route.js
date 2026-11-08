import { clearSessionCookie, publicUser, requireUser, revokeSessionToken } from "@/lib/server/auth";
import { HttpError, ok, parseBody, withErrors } from "@/lib/server/http";
import { deleteAccount } from "@/lib/server/services/account";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { deleteAccountSchema, updateNameSchema } from "@/lib/server/validators/user";
import { User } from "@/models/user";

export const runtime = "nodejs";

export const PATCH = withErrors(async (req) => {
  const user = await requireUser(req);
  const { name } = await parseBody(updateNameSchema, req);
  user.name = name;
  await user.save();
  return ok({ user: publicUser(user) });
});

export const DELETE = withRateLimit([{ name: "delete-account", limit: 3, windowMs: HOUR, by: "user" }], async (req) => {
  const session = await requireUser(req);
  if (session.role === "admin") throw new HttpError(403, "Admin accounts can’t be deleted here");
  const { password } = await parseBody(deleteAccountSchema, req);

  const user = await User.findById(session._id).select("+password");
  if (!(await user.comparePassword(password))) {
    throw new HttpError(400, "Password is incorrect", { password: ["Password is incorrect"] });
  }

  await deleteAccount(user);
  await revokeSessionToken(req);
  await clearSessionCookie();
  return ok({ message: "Account deleted" });
});
