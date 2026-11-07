import { ok, withErrors } from "@/lib/server/http";
import { clearSessionCookie } from "@/lib/server/auth";

export const runtime = "nodejs";

export const POST = withErrors(async () => {
  await clearSessionCookie();
  return ok({ message: "Logged out" });
});
