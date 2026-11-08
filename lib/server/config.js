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
