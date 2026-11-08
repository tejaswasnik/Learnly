import { publicUser, requireUser, setSessionCookie } from "@/lib/server/auth";
import { HttpError, ok, parseBody } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { changePasswordSchema } from "@/lib/server/validators/auth";
import { User } from "@/models/user";

export const runtime = "nodejs";

export const PATCH = withRateLimit([
  { name: "change-password", limit: 5, windowMs: HOUR, by: "user" },
], async (req) => {
  const session = await requireUser(req);
  const { currentPassword, newPassword } = await parseBody(changePasswordSchema, req);

  // The password hash is excluded from normal queries.
  const user = await User.findById(session._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new HttpError(400, "Current password is incorrect", { currentPassword: ["Current password is incorrect"] });
  }

  user.password = newPassword; // hashed by the pre-save hook
  user.tokenVersion += 1; // signs out every other session (their tokens carry the old version)
  await user.save();

  // Re-issue this session's cookie with the new version so the person changing the password stays signed in.
  await setSessionCookie(user);
  return ok({ message: "Password updated", user: publicUser(user) });
});
