import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { getConfig } from "@/lib/server/config";
import { connectDb } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { User } from "@/models/user";

export const SESSION_COOKIE = "token";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export function signToken(user) {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role, tv: user.tokenVersion },
    getConfig().JWT_SECRET,
    { expiresIn: SESSION_SECONDS },
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
  const user = await User.findById(payload.id);
  if (!user || payload.tv !== user.tokenVersion) return null;
  return user;
}

export async function requireUser(req) {
  const user = await getCurrentUser(req);
  if (!user) throw new HttpError(401, "Authentication required");
  return user;
}

export async function requireRole(req, ...roles) {
  const user = await requireUser(req);
  if (!roles.includes(user.role)) throw new HttpError(403, "You do not have access to this resource");
  return user;
}
