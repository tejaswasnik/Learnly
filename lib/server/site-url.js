/** The public origin, without a trailing slash. Falls back to localhost when APP_URL is unset or invalid. */
export function siteUrl() {
  try {
    return new URL(process.env.APP_URL || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}
