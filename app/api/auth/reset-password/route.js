import { ok, parseBody, withErrors } from "@/lib/server/http";
import { resetPassword } from "@/lib/server/services/password-reset";
import { resetPasswordSchema } from "@/lib/server/validators/auth";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const { token, newPassword } = await parseBody(resetPasswordSchema, req);
  await resetPassword(token, newPassword);
  return ok({ message: "Password updated. Log in with your new password." });
});
