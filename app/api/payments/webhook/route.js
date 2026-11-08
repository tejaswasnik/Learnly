import { getConfig } from "@/lib/server/config";
import { connectDb } from "@/lib/server/db";
import { HttpError, ok, withErrors } from "@/lib/server/http";
import { settleOrder } from "@/lib/server/services/payments";
import { verifyWebhookSignature } from "@/lib/server/services/razorpay";
import { Order } from "@/models/order";

export const runtime = "nodejs";

const SETTLE_EVENTS = new Set(["payment.captured", "order.paid"]);

// Server-to-server: Razorpay calls this with no session. The webhook signature is the only authority.
export const POST = withErrors(async (req) => {
  if (!getConfig().RAZORPAY_WEBHOOK_SECRET) throw new HttpError(500, "Webhook is not configured");

  // The signature covers the exact bytes sent, so read the raw text before any JSON parsing.
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    throw new HttpError(400, "Invalid webhook signature");
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "Invalid webhook body");
  }

  const payment = event?.payload?.payment?.entity;
  const orderId = payment?.order_id ?? event?.payload?.order?.entity?.id;
  const eventName = String(event?.event ?? "");
  if (!orderId || !(SETTLE_EVENTS.has(eventName) || eventName === "payment.failed")) {
    return ok({ ignored: true });
  }

  await connectDb();
  const order = await Order.findOne({ razorpayOrderId: orderId });
  if (!order) {
    console.warn(`Webhook ${eventName}: unknown order ${orderId}`);
    return ok({ ignored: true });
  }

  if (eventName === "payment.failed") {
    await Order.updateOne({ _id: order._id, status: "created" }, { status: "failed" });
    console.log(`Webhook payment.failed: order ${orderId} handled`);
    return ok({});
  }

  // Never settle on an amount or currency that differs from what we asked Razorpay to charge.
  if (!payment || payment.id == null || payment.amount !== order.amount || payment.currency !== order.currency) {
    console.error(`Webhook ${eventName}: amount/currency mismatch for order ${orderId}`);
    return ok({ ignored: true });
  }

  const { alreadyPaid } = await settleOrder({ order, paymentId: payment.id });
  console.log(`Webhook ${eventName}: order ${orderId} ${alreadyPaid ? "already paid" : "settled"}`);
  return ok({});
});
