import { ok, parseBody } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { resetPassword } from "@/lib/server/services/password-reset";
import { resetPasswordSchema } from "@/lib/server/validators/auth";

export const runtime = "nodejs";

export const POST = withRateLimit([
  { name: "reset", limit: 10, windowMs: HOUR, by: "ip" },
], async (req) => {
  const { token, newPassword } = await parseBody(resetPasswordSchema, req);
  await resetPassword(token, newPassword);
  return ok({ message: "Password updated. Log in with your new password." });
});
