import crypto from "node:crypto";
import { connectDb } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { AuthToken } from "@/models/auth-token";

const hash = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

/** Creates a single-use token. Returns the raw value (to email); only its hash is stored. Older unused tokens of the same type are removed. */
export async function createToken(userId, type, ttlMs) {
  await connectDb();
  await AuthToken.deleteMany({ userId, type, usedAt: null });
  const raw = crypto.randomBytes(32).toString("base64url");
  await AuthToken.create({ userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + ttlMs) });
  return raw;
}

/** Marks the token used (atomically, so a link works once) and returns its user id. Invalid, used and expired all look the same. */
export async function consumeToken(raw, type) {
  await connectDb();
  const row =
    typeof raw === "string" && raw.length >= 20
      ? await AuthToken.findOneAndUpdate(
          { tokenHash: hash(raw), type, usedAt: null, expiresAt: { $gt: new Date() } },
          { usedAt: new Date() },
        )
      : null;
  if (!row) throw new HttpError(400, "This link is invalid or has expired");
  return row.userId;
}

/** When the newest unused token of this type was created, or null. Used for resend cooldowns. */
export async function lastTokenCreatedAt(userId, type) {
  await connectDb();
  const row = await AuthToken.findOne({ userId, type, usedAt: null }).sort({ createdAt: -1 }).select("createdAt").lean();
  return row?.createdAt ?? null;
}
