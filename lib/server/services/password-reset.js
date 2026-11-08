import { connectDb } from "@/lib/server/db";
import { passwordChangedMessage, resetPasswordMessage } from "@/lib/server/email-templates";
import { HttpError } from "@/lib/server/http";
import { consumeToken, createToken } from "@/lib/server/services/auth-tokens";
import { sendEmail } from "@/lib/server/services/email";
import { AuthToken } from "@/models/auth-token";
import { User } from "@/models/user";

const RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Emails a reset link if the account exists. Callers respond before awaiting this (see the route), so the
 * response never reveals whether the email is registered. Failures are logged, never thrown to the user.
 */
export async function sendResetLink(email) {
  try {
    await connectDb();
    const user = await User.findOne({ email });
    if (!user) return;
    const token = await createToken(user._id, "reset-password", RESET_TTL_MS);
    await sendEmail({ to: user.email, ...resetPasswordMessage(user, token) });
  } catch (err) {
    console.error("Password reset email not sent", err?.message);
  }
}

/** Sets a new password from an emailed token. Signs out every session and does not sign the user in. */
export async function resetPassword(rawToken, newPassword) {
  const userId = await consumeToken(rawToken, "reset-password");
  await connectDb();
  const user = await User.findById(userId).select("+password");
  if (!user) throw new HttpError(400, "This link is invalid or has expired");

  user.password = newPassword; // hashed by the pre-save hook
  user.passwordSet = true;
  user.tokenVersion += 1; // every existing session stops working
  if (!user.emailVerified) {
    user.emailVerified = true; // they just proved they control the inbox
    user.emailVerifiedAt = new Date();
  }
  await user.save();
  await AuthToken.deleteMany({ userId: user._id, type: "reset-password" });

  await sendEmail({ to: user.email, ...passwordChangedMessage(user) }).catch((err) =>
    console.error("Password changed notice not sent", err?.message),
  );
}
