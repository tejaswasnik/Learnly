import { z } from "zod";

const schema = z.object({
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.url(),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  // Optional so the app boots without it; the webhook route refuses to run until it is set.
  RAZORPAY_WEBHOOK_SECRET: z.string().min(8).optional(),
  APP_URL: z.url(),
  // Optional outside production: without a key, emails are printed to the server console instead.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  // Bearer secret for the scheduled upload cleanup; the endpoint answers 500 until it is set.
  CRON_SECRET: z.string().min(16).optional(),
}).superRefine((env, ctx) => {
  if (process.env.NODE_ENV !== "production") return;
  for (const key of ["RESEND_API_KEY", "EMAIL_FROM"]) {
    if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "Required in production" });
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
