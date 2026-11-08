import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { findOrLinkUser, getGoogle, readAndClearFlowCookies, readClaims, requireGoogle, safeEqual, setPendingSignup } from "@/lib/server/google";
import { HttpError } from "@/lib/server/http";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { safeNext } from "@/lib/shared/safe-next";

export const runtime = "nodejs";

const home = (user) => (user.role === "instructor" ? "/instructor/dashboard" : "/dashboard");

// Step 2: Google sends the browser back with ?code&state. Every outcome is a redirect, so people never see JSON.
export const GET = withRateLimit([{ name: "google-callback", limit: 30, windowMs: HOUR, by: "ip" }], async (req) => {
  requireGoogle();
  const base = getConfig().APP_URL;
  const to = (path) => NextResponse.redirect(new URL(path, base));
  const fail = (code) => to(`/login?error=${code}`);

  const params = new URL(req.url).searchParams;
  const flow = await readAndClearFlowCookies();
  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "google_cancelled" : "google_failed");

  const code = params.get("code");
  if (!code || !flow.verifier || !safeEqual(params.get("state"), flow.state)) return fail("google_failed");

  let claims;
  try {
    claims = readClaims(await getGoogle().validateAuthorizationCode(code, flow.verifier));
  } catch (err) {
    console.error("Google sign-in failed", err?.name, err?.message?.slice(0, 120));
    return fail("google_failed");
  }
  if (!claims.emailVerified) return fail("google_unverified");

  let user;
  try {
    user = await findOrLinkUser(claims);
  } catch (err) {
    if (err instanceof HttpError) return fail("google_failed");
    throw err;
  }

  const next = safeNext(flow.next);
  if (!user) {
    await setPendingSignup(claims);
    return to(`/register/google${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  await setSessionCookie(user);
  return to(next ?? home(user));
});
