import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseBody } from "@/lib/server/http";
import { MINUTE, withRateLimit } from "@/lib/server/services/rate-limit";
import { publicUser, setSessionCookie } from "@/lib/server/auth";
import { loginSchema } from "@/lib/server/validators/auth";
import { User } from "@/models/user";

export const runtime = "nodejs";

export const POST = withRateLimit([
  { name: "login-ip-email", limit: 10, windowMs: 15 * MINUTE, by: "ip+email" },
  { name: "login-ip", limit: 50, windowMs: 15 * MINUTE, by: "ip" },
], async (req) => {
  const { email, password } = await parseBody(loginSchema, req);
  await connectDb();

  const user = await User.findOne({ email }).select("+password");
  const valid = user ? await user.comparePassword(password) : false;
  if (!user || !valid) throw new HttpError(401, "Invalid credentials");

  await setSessionCookie(user);
  return ok({
    user: publicUser(user),
    redirectTo: user.role === "instructor" ? "/instructor/dashboard" : "/dashboard",
  });
});
