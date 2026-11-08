import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/auth";
import { withErrors } from "@/lib/server/http";
import { safeNext } from "@/lib/shared/safe-next";

export const runtime = "nodejs";

// Landing point for a session cookie that has a valid signature but no live user (revoked or deleted).
// proxy.js cannot see that, so it would bounce /login back to the dashboard; clearing the cookie breaks the loop.
export const GET = withErrors(async (req) => {
  await clearSessionCookie();
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const target = new URL("/login", req.url);
  if (next) target.searchParams.set("next", next);
  return NextResponse.redirect(target);
});
