import { ok, withErrors } from "@/lib/server/http";

export const runtime = "nodejs";

export const GET = withErrors(async () => ok({ status: "ok" }));
