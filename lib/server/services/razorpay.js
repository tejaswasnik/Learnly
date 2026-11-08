import crypto from "node:crypto";
import Razorpay from "razorpay";
import { getConfig } from "@/lib/server/config";

let client;

export function getRazorpay() {
  if (!client) {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getConfig();
    client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  }
  return client;
}

/** Checkout signature: HMAC-SHA256 of `${orderId}|${paymentId}` with the key secret, compared in constant time. */
export function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac("sha256", getConfig().RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
