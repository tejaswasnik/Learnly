import { ok, withErrors } from "@/lib/server/http";
import { clearSessionCookie, revokeSessionToken } from "@/lib/server/auth";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  // Logout always succeeds: a database hiccup must not leave the user unable to drop their cookie.
  await revokeSessionToken(req).catch((err) => console.error("Token revoke failed", err?.message));
  await clearSessionCookie();
  return ok({ message: "Logged out" });
});
