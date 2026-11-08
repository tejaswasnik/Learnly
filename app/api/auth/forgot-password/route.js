import { after } from "next/server";
import { ok, parseBody } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { sendResetLink } from "@/lib/server/services/password-reset";
import { forgotPasswordSchema } from "@/lib/server/validators/auth";

export const runtime = "nodejs";

const MESSAGE = "If an account exists for that email, we sent a reset link.";

export const POST = withRateLimit([
  { name: "forgot-ip", limit: 5, windowMs: HOUR, by: "ip" },
  { name: "forgot-email", limit: 3, windowMs: HOUR, by: "email" },
], async (req) => {
  const { email } = await parseBody(forgotPasswordSchema, req);
  // The lookup, token and email run after the response, so timing is identical whether or not the account exists.
  after(() => sendResetLink(email));
  return ok({ message: MESSAGE });
});
