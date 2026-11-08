import { HttpError } from "@/lib/server/http";
import { verifyEmailMessage } from "@/lib/server/email-templates";
import { createToken, lastTokenCreatedAt } from "@/lib/server/services/auth-tokens";
import { sendEmail } from "@/lib/server/services/email";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

export async function sendVerificationEmail(user) {
  const token = await createToken(user._id, "verify-email", VERIFY_TTL_MS);
  await sendEmail({ to: user.email, ...verifyEmailMessage(user, token) });
}

/** Resend with a cooldown so the endpoint cannot be used to flood an inbox. */
export async function resendVerificationEmail(user) {
  const last = await lastTokenCreatedAt(user._id, "verify-email");
  const elapsed = last ? Date.now() - last.getTime() : Infinity;
  if (elapsed < RESEND_COOLDOWN_MS) {
    throw new HttpError(429, `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)} seconds before asking for another email`);
  }
  await sendVerificationEmail(user);
}
