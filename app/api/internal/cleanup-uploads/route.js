import crypto from "node:crypto";
import { getConfig } from "@/lib/server/config";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { cleanupOrphans } from "@/lib/server/services/orphan-cleanup";

export const runtime = "nodejs";

function hasValidSecret(req) {
  const secret = getConfig().CRON_SECRET;
  if (!secret) throw new HttpError(500, "Cleanup is not configured");
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  // Hash both sides so the comparison is constant-time even when the lengths differ.
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

// Called by a scheduler, never by a browser: bearer secret only, no cookie auth. Dry run unless ?apply=true.
export const POST = withErrors(async (req) => {
  if (!hasValidSecret(req)) throw new HttpError(401, "Unauthorized");
  const params = new URL(req.url).searchParams;
  const max = Number(params.get("max"));
  const summary = await cleanupOrphans({
    apply: params.get("apply") === "true",
    ...(Number.isInteger(max) && max >= 1 && max <= 500 ? { maxDeletes: max } : {}),
  });
  return ok({ summary });
});
