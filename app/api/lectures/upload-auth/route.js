import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { getImageKit } from "@/lib/server/services/imagekit";

export const runtime = "nodejs";

const UPLOAD_AUTH_SECONDS = 15 * 60;

// Short-lived, single-use parameters so the browser can upload a video straight to ImageKit
// without the private key ever leaving the server.
export const GET = withRateLimit([
  { name: "upload-auth", limit: 60, windowMs: HOUR, by: "user" },
], async (req) => {
  await requireRole(req, "instructor");
  // The SDK's second argument is an absolute Unix timestamp (its doc comment says "seconds from now", which is wrong).
  const expiresAt = Math.floor(Date.now() / 1000) + UPLOAD_AUTH_SECONDS;
  const { token, signature, expire } = getImageKit().helper.getAuthenticationParameters(undefined, expiresAt);
  const config = getConfig();
  return NextResponse.json(
    {
      success: true,
      token,
      signature,
      expire,
      publicKey: config.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
