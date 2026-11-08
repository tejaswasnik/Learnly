import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseBody, withErrors } from "@/lib/server/http";
import { publicUser, setSessionCookie } from "@/lib/server/auth";
import { sendVerificationEmail } from "@/lib/server/services/verification";
import { registerSchema } from "@/lib/server/validators/auth";
import { User } from "@/models/user";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const { name, email, password, role } = await parseBody(registerSchema, req);
  await connectDb();

  if (await User.exists({ email })) throw new HttpError(409, "An account with this email already exists");

  let user;
  try {
    user = await User.create({ name, email, password, role });
  } catch (err) {
    if (err?.code === 11000) throw new HttpError(409, "An account with this email already exists");
    throw err;
  }

  // A failed email must not fail the signup: the user can resend from the banner.
  await sendVerificationEmail(user).catch((err) => console.error("Verification email not sent", err?.message));

  await setSessionCookie(user);
  return ok({ user: publicUser(user) }, { status: 201 });
});
