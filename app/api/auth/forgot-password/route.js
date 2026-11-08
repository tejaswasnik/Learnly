import { after } from "next/server";
import { ok, parseBody, withErrors } from "@/lib/server/http";
import { sendResetLink } from "@/lib/server/services/password-reset";
import { forgotPasswordSchema } from "@/lib/server/validators/auth";

export const runtime = "nodejs";

const MESSAGE = "If an account exists for that email, we sent a reset link.";

export const POST = withErrors(async (req) => {
  const { email } = await parseBody(forgotPasswordSchema, req);
  // The lookup, token and email run after the response, so timing is identical whether or not the account exists.
  after(() => sendResetLink(email));
  return ok({ message: MESSAGE });
});
