import { NextResponse } from "next/server";
import { generateCodeVerifier, generateState } from "arctic";
import { getGoogle, requireGoogle, setFlowCookies } from "@/lib/server/google";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { safeNext } from "@/lib/shared/safe-next";

export const runtime = "nodejs";

// Step 1: remember state + PKCE verifier in short-lived httpOnly cookies, then send the browser to Google.
export const GET = withRateLimit([{ name: "google-start", limit: 30, windowMs: HOUR, by: "ip" }], async (req) => {
  requireGoogle();
  const state = generateState();
  const verifier = generateCodeVerifier();
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  await setFlowCookies({ state, verifier, next });
  const url = getGoogle().createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
  url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url);
});
