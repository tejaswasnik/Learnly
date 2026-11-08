import crypto from "node:crypto";
import { z } from "zod";
import { publicUser, setSessionCookie } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { clearPendingSignup, displayName, importGooglePhoto, readPendingSignup, requireGoogle } from "@/lib/server/google";
import { HttpError, ok, parseBody } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { SIGNUP_ROLES } from "@/lib/shared/constants";
import { User } from "@/models/user";

export const runtime = "nodejs";

const schema = z.object({ role: z.enum(SIGNUP_ROLES) });

// Step 3 (new people only): they picked Student or Instructor, so the account is created now.
export const POST = withRateLimit([{ name: "google-complete", limit: 10, windowMs: HOUR, by: "ip" }], async (req) => {
  requireGoogle();
  const { role } = await parseBody(schema, req);
  const pending = await readPendingSignup();
  if (!pending) throw new HttpError(400, "That sign-up took too long. Please start again.");

  await connectDb();
  let user;
  try {
    user = await User.create({
      name: displayName(pending),
      email: pending.email,
      // Unusable until they set one with "Forgot password"; Google is how they sign in.
      password: crypto.randomBytes(32).toString("hex"),
      role,
      passwordSet: false,
      googleId: pending.sub,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  } catch (err) {
    if (err?.code === 11000) throw new HttpError(409, "An account with this email already exists. Sign in instead.");
    throw err;
  }

  if (pending.picture) await importGooglePhoto(user, pending.picture);
  await clearPendingSignup();
  await setSessionCookie(user);
  return ok({ user: publicUser(user), redirectTo: role === "instructor" ? "/instructor/dashboard" : "/dashboard" }, { status: 201 });
});
