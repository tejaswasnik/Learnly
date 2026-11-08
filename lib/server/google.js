import crypto from "node:crypto";
import { Google, decodeIdToken } from "arctic";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getConfig } from "@/lib/server/config";
import { connectDb } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { setAvatar } from "@/lib/server/services/avatar";
import { validateImageFile } from "@/lib/server/validators/image";
import { IMAGE_MAX_BYTES } from "@/lib/shared/constants";
import { User } from "@/models/user";

export const FLOW_COOKIES = ["g_state", "g_verifier", "g_next"];
export const PENDING_COOKIE = "g_pending";
const FLOW_SECONDS = 10 * 60;
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

// Used by the login and register pages to decide whether to show the button. It must never throw: a configuration
// problem elsewhere should not take those pages down. (The routes validate the full config when they run.)
export function googleEnabled() {
  try {
    return Boolean(getConfig().GOOGLE_CLIENT_ID);
  } catch {
    return false;
  }
}

/** Routes call this first: with no credentials configured the feature simply does not exist. */
export function requireGoogle() {
  if (!googleEnabled()) throw new HttpError(404, "Not found");
}

let client;
export function getGoogle() {
  if (!client) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL } = getConfig();
    client = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${APP_URL.replace(/\/$/, "")}/api/auth/google/callback`);
  }
  return client;
}

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax", // Google redirects back with a top-level GET, which lax cookies accompany
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: FLOW_SECONDS,
});

export async function setFlowCookies({ state, verifier, next }) {
  const store = await cookies();
  store.set("g_state", state, cookieOptions());
  store.set("g_verifier", verifier, cookieOptions());
  if (next) store.set("g_next", next, cookieOptions());
}

export async function readAndClearFlowCookies() {
  const store = await cookies();
  const values = Object.fromEntries(FLOW_COOKIES.map((name) => [name, store.get(name)?.value]));
  for (const name of FLOW_COOKIES) store.set(name, "", { ...cookieOptions(), maxAge: 0 });
  return { state: values.g_state, verifier: values.g_verifier, next: values.g_next };
}

export const safeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
};

/** Verified identity from Google's ID token. The token arrives straight from Google's token endpoint over TLS in exchange for our code and client secret, so its signature need not be checked; audience, issuer and expiry still are. */
export function readClaims(tokens) {
  const claims = decodeIdToken(tokens.idToken());
  const { GOOGLE_CLIENT_ID } = getConfig();
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const valid =
    audience.includes(GOOGLE_CLIENT_ID) &&
    GOOGLE_ISSUERS.includes(claims.iss) &&
    typeof claims.exp === "number" && claims.exp * 1000 > Date.now() &&
    typeof claims.sub === "string" && claims.sub.length > 0 &&
    typeof claims.email === "string";
  if (!valid) throw new HttpError(400, "Invalid Google identity");
  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: typeof claims.name === "string" ? claims.name : "",
    picture: typeof claims.picture === "string" ? claims.picture : "",
  };
}

/**
 * An existing account for this Google identity: matched by Google id first, then by email. An email match links the
 * Google id and marks the email verified (Google has just verified it). Returns null for a brand-new person.
 */
export async function findOrLinkUser(claims) {
  await connectDb();
  const byGoogle = await User.findOne({ googleId: claims.sub });
  if (byGoogle) return byGoogle;
  const byEmail = await User.findOne({ email: claims.email });
  if (!byEmail) return null;
  if (byEmail.googleId && byEmail.googleId !== claims.sub) throw new HttpError(409, "Email already linked to another Google account");
  byEmail.googleId = claims.sub;
  if (!byEmail.emailVerified) {
    byEmail.emailVerified = true;
    byEmail.emailVerifiedAt = new Date();
  }
  await byEmail.save();
  return byEmail;
}

// New people choose a role before the account exists, so their Google identity waits in a short-lived signed cookie.
export async function setPendingSignup(claims) {
  const token = jwt.sign(
    { purpose: "google-signup", sub: claims.sub, email: claims.email, name: claims.name, picture: claims.picture },
    getConfig().JWT_SECRET,
    { expiresIn: FLOW_SECONDS },
  );
  (await cookies()).set(PENDING_COOKIE, token, cookieOptions());
}

export async function readPendingSignup() {
  const token = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const p = jwt.verify(token, getConfig().JWT_SECRET, { algorithms: ["HS256"] });
    return p.purpose === "google-signup" ? p : null;
  } catch {
    return null;
  }
}

export async function clearPendingSignup() {
  (await cookies()).set(PENDING_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

/** Name for the new account: Google's, or the part of the email before the @ when Google gave none usable. */
export function displayName(pending) {
  const name = (pending.name || "").trim().slice(0, 80);
  return name.length >= 2 ? name : pending.email.split("@")[0].slice(0, 80).padEnd(2, "_");
}

/** Best effort: copy Google's profile photo into our own ImageKit storage. Only Google's image host, https, size-capped; any failure just means initials. */
export async function importGooglePhoto(user, url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".googleusercontent.com")) return;
    const res = await fetch(u, { signal: AbortSignal.timeout(5000), redirect: "error" });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > IMAGE_MAX_BYTES) return;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > IMAGE_MAX_BYTES) return;
    const type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    await setAvatar(user, await validateImageFile(new File([bytes], "google-photo", { type })));
  } catch (err) {
    console.error("Google photo not imported", err?.name);
  }
}
