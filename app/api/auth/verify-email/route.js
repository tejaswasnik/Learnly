import { publicUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseBody } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { consumeToken } from "@/lib/server/services/auth-tokens";
import { tokenSchema } from "@/lib/server/validators/auth";
import { User } from "@/models/user";

export const runtime = "nodejs";

export const POST = withRateLimit([
  { name: "verify-email", limit: 10, windowMs: HOUR, by: "ip" },
], async (req) => {
  const { token } = await parseBody(tokenSchema, req);
  const userId = await consumeToken(token, "verify-email");
  await connectDb();
  const user = await User.findByIdAndUpdate(userId, { emailVerified: true, emailVerifiedAt: new Date() }, { new: true });
  if (!user) throw new HttpError(400, "This link is invalid or has expired");
  return ok({ user: publicUser(user) });
});
