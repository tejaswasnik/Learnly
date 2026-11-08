import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getConfig } from "@/lib/server/config";
import { connectDb } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { RevokedToken } from "@/models/revoked-token";
import { User } from "@/models/user";

export const SESSION_COOKIE = "token";
export const VERIFY_FIRST_MESSAGE = "Verify your email first. Use the banner at the top of the page to resend the link.";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export function signToken(user) {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role, tv: user.tokenVersion },
    getConfig().JWT_SECRET,
    { expiresIn: SESSION_SECONDS, jwtid: crypto.randomUUID() },
  );
}

export async function setSessionCookie(user) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    photourl: user.photourl,
    emailVerified: Boolean(user.emailVerified),
    hasPassword: user.passwordSet !== false,
  };
}

async function readToken(req) {
  const bearer = req?.headers?.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  if (req?.cookies?.get) return req.cookies.get(SESSION_COOKIE)?.value ?? null;
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** Returns the signed-in user document, or null. Works with a request (route handlers) or without (server components). */
export async function getCurrentUser(req) {
  const token = await readToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, getConfig().JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
  if (!payload?.id || !mongoose.isValidObjectId(payload.id)) return null;

  await connectDb();
  // Tokens issued before the blacklist existed have no jti; they stay valid until they expire.
  const [user, revoked] = await Promise.all([
    User.findById(payload.id),
    payload.jti ? RevokedToken.exists({ jti: payload.jti }) : null,
  ]);
  if (!user || revoked || user.deletedAt || payload.tv !== user.tokenVersion) return null;
  return user;
}

/** The signed-in user's id from the token alone (no database), for rate limiting. Null if there is no valid token. */
export async function sessionUserId(req) {
  const token = await readToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getConfig().JWT_SECRET, { algorithms: ["HS256"] });
    return mongoose.isValidObjectId(payload?.id) ? `user:${payload.id}` : null;
  } catch {
    return null;
  }
}

/** Logout: blacklist the presented token so a copy of it stops working immediately. Ignores missing or already-dead tokens. */
export async function revokeSessionToken(req) {
  const token = await readToken(req);
  if (!token) return;
  let payload;
  try {
    payload = jwt.verify(token, getConfig().JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return;
  }
  if (!payload?.jti || !payload.exp) return;
  await connectDb();
  await RevokedToken.updateOne({ jti: payload.jti }, { $setOnInsert: { expiresAt: new Date(payload.exp * 1000) } }, { upsert: true });
}

export async function requireUser(req) {
  const user = await getCurrentUser(req);
  if (!user) throw new HttpError(401, "Authentication required");
  return user;
}

/** Signed in with a verified email (admins are exempt). Gate for anything that spends money or publishes. */
export async function requireVerified(req, ...roles) {
  const user = roles.length ? await requireRole(req, ...roles) : await requireUser(req);
  if (!user.emailVerified && user.role !== "admin") {
    throw new HttpError(403, VERIFY_FIRST_MESSAGE);
  }
  return user;
}

export async function requireRole(req, ...roles) {
  const user = await requireUser(req);
  if (!roles.includes(user.role)) throw new HttpError(403, "You do not have access to this resource");
  return user;
}

/** For server pages behind the proxy guard: returns the user, or clears a stale cookie and sends them to log in. */
export async function requirePageUser(returnTo = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/api/auth/expired?next=${encodeURIComponent(returnTo)}`);
  return user;
}
