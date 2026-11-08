import { z } from "zod";

// .env files often carry blank placeholders (`SMTP_USER=`). For optional settings a blank means "not set", not "invalid".
const optional = (schema) => z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

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
    // Email over SMTP (nodemailer). Optional outside production: with no SMTP_HOST, emails are printed to the server console.
    SMTP_HOST: optional(z.string().min(1)),
    SMTP_PORT: optional(z.coerce.number().int().min(1).max(65535)),
    // true = implicit TLS (usually port 465); false = plain or STARTTLS (587, 25). Defaults to true only for port 465.
    SMTP_SECURE: optional(z.enum(["true", "false"])),
    SMTP_USER: optional(z.string().min(1)),
    SMTP_PASS: optional(z.string().min(1)),
    EMAIL_FROM: optional(z.string().min(3)),
    // Bearer secret for the scheduled upload cleanup; the endpoint answers 500 until it is set.
    CRON_SECRET: optional(z.string().min(16)),
  })
  .superRefine((env, ctx) => {
    const need = (key, message = "Required in production") => ctx.addIssue({ code: "custom", path: [key], message });
    if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASS)) need(env.SMTP_USER ? "SMTP_PASS" : "SMTP_USER", "SMTP_USER and SMTP_PASS go together");
    if (env.SMTP_HOST && !env.EMAIL_FROM) need("EMAIL_FROM", "Required when SMTP_HOST is set");
    if (process.env.NODE_ENV !== "production") return;
    for (const key of ["SMTP_HOST", "EMAIL_FROM"]) if (!env[key]) need(key);
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
