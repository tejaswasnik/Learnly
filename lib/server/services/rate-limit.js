import crypto from "node:crypto";
import { sessionUserId } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { fail, withErrors } from "@/lib/server/http";
import { RateLimit } from "@/models/rate-limit";

/**
 * Fixed-window rate limiting backed by MongoDB. The storage lives behind hit() alone, so Redis can replace it later
 * without touching any route. If the database fails the limiter fails open: it logs and lets the request through.
 */
export async function hit({ key, limit, windowMs }) {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const doc = { key: `${key}:${windowStart}` };
  const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } };

  let row;
  try {
    await connectDb();
    try {
      row = await RateLimit.findOneAndUpdate(doc, update, { upsert: true, new: true });
    } catch (err) {
      if (err?.code !== 11000) throw err; // two first requests raced to create the row; the second just increments
      row = await RateLimit.findOneAndUpdate(doc, update, { new: true });
    }
  } catch (err) {
    console.error("Rate limiter unavailable, allowing request", err?.message);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)),
  };
}

/**
 * First hop of x-forwarded-for, else x-real-ip, else "unknown". Only trustworthy when the hosting platform
 * overwrites these headers; otherwise a client can forge them. Used for rate limiting and nothing else.
 */
export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

const digest = (value) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);

async function emailFrom(req) {
  try {
    const body = await req.clone().json();
    return typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

let warnedUnknownIp = false;

// Resolves who a rule counts against. Returns null to skip the rule for this request.
async function subjectFor(by, req) {
  const ip = getClientIp(req);
  if (typeof by === "function") return by(req);
  if (by === "user") return (await sessionUserId(req)) ?? (ip === "unknown" ? null : `ip:${ip}`);
  if (by === "email") {
    const email = await emailFrom(req);
    return email ? `email:${digest(email)}` : null;
  }
  if (by === "ip+email") {
    const email = await emailFrom(req);
    return email ? `${ip}:${digest(email)}` : null;
  }
  // Plain "ip": with no usable address every visitor would share one bucket, so skip instead of blocking everyone.
  if (ip === "unknown") {
    if (!warnedUnknownIp) {
      warnedUnknownIp = true;
      console.warn("Rate limit by IP skipped: no x-forwarded-for / x-real-ip header. Configure your proxy to set one.");
    }
    return null;
  }
  return `ip:${ip}`;
}

const retryText = (seconds) => {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
};

/**
 * withErrors plus rate limits. A rule is { name, limit, windowMs, by } where by is "ip", "user", "email",
 * "ip+email" or a function (req) => subject string. Over the limit: 429 in the standard envelope with Retry-After.
 */
export function withRateLimit(rules, handler) {
  return withErrors(async (req, ctx) => {
    let blockedFor = 0;
    for (const rule of rules) {
      const subject = await subjectFor(rule.by, req);
      if (!subject) continue;
      const result = await hit({ key: `${rule.name}:${subject}`, limit: rule.limit, windowMs: rule.windowMs });
      if (!result.allowed) blockedFor = Math.max(blockedFor, result.retryAfterSeconds);
    }
    if (blockedFor) {
      const res = fail(`Too many attempts. Try again in ${retryText(blockedFor)}.`, 429);
      res.headers.set("Retry-After", String(blockedFor));
      return res;
    }
    return handler(req, ctx);
  });
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
