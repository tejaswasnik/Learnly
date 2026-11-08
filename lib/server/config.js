import { z } from "zod";

// .env files often carry blank placeholders (`GMAIL_USER=`). For optional settings a blank means "not set", not "invalid".
const optional = (schema) => z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const GMAIL_KEYS = ["GMAIL_USER", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"];

const schema = z
  .object({
    MONGO_URI: z.string().min(1),
    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    IMAGEKIT_PUBLIC_KEY: z.string().min(1),
    IMAGEKIT_PRIVATE_KEY: z.string().min(1),
    IMAGEKIT_URL_ENDPOINT: z.url(),
    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    // Optional so the app boots without it; the webhook route refuses to run until it is set.
    RAZORPAY_WEBHOOK_SECRET: optional(z.string().min(8)),
    APP_URL: z.url(),
    // Email through Gmail with OAuth 2.0 (nodemailer). All four go together. Outside production, with none set,
    // emails are printed to the server console instead of being sent.
    GMAIL_USER: optional(z.email()),
    GMAIL_CLIENT_ID: optional(z.string().min(1)),
    GMAIL_CLIENT_SECRET: optional(z.string().min(1)),
    GMAIL_REFRESH_TOKEN: optional(z.string().min(1)),
    // Display name and address for the From header. Defaults to `Learnly <GMAIL_USER>`. Gmail replaces any
    // address that is not the account itself or one of its "Send mail as" aliases.
    EMAIL_FROM: optional(z.string().min(3)),
    // Bearer secret for the scheduled upload cleanup; the endpoint answers 500 until it is set.
    CRON_SECRET: optional(z.string().min(16)),
  })
  .superRefine((env, ctx) => {
    const issue = (key, message) => ctx.addIssue({ code: "custom", path: [key], message });
    const missing = GMAIL_KEYS.filter((key) => !env[key]);
    const partial = missing.length > 0 && missing.length < GMAIL_KEYS.length;
    if (partial) for (const key of missing) issue(key, "Set all four GMAIL_* values together");
    if (process.env.NODE_ENV === "production" && missing.length === GMAIL_KEYS.length) {
      for (const key of missing) issue(key, "Required in production");
    }
  });

let cached;

export function getConfig() {
  if (cached) return cached;
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid or missing environment variables (${problems}). See .env.example.`);
  }
  cached = result.data;
  return cached;
}
