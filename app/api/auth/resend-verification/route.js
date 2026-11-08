import { requireUser } from "@/lib/server/auth";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { resendVerificationEmail } from "@/lib/server/services/verification";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  if (user.emailVerified) throw new HttpError(409, "Your email is already verified");
  await resendVerificationEmail(user);
  return ok({ message: "Verification email sent" });
});
