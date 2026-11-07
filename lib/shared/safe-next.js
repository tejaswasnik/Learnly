/** Returns `next` only if it is a same-site relative path; otherwise null (prevents open redirects). */
export function safeNext(next) {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
