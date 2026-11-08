import { requireUser } from "@/lib/server/auth";
import { HttpError, ok } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { resendVerificationEmail } from "@/lib/server/services/verification";

export const runtime = "nodejs";

export const POST = withRateLimit([
  { name: "resend-verification", limit: 3, windowMs: HOUR, by: "user" },
], async (req) => {
  const user = await requireUser(req);
  if (user.emailVerified) throw new HttpError(409, "Your email is already verified");
  await resendVerificationEmail(user);
  return ok({ message: "Verification email sent" });
});
