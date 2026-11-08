import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseBody, withErrors } from "@/lib/server/http";
import { enrollUser } from "@/lib/server/services/enrollment";
import { verifySignature } from "@/lib/server/services/razorpay";
import { verifyPaymentSchema } from "@/lib/server/validators/payment";
import { Order } from "@/models/order";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await parseBody(verifyPaymentSchema, req);
  await connectDb();

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) throw new HttpError(404, "Order not found");
  if (String(order.userId) !== String(user._id)) throw new HttpError(403, "This order belongs to another account");

  // Already paid: succeed again (and make sure the enrollment exists), so retries are harmless.
  if (order.status === "paid") {
    await enrollUser({ userId: user._id, courseId: order.courseId, orderId: order._id });
    return ok({ courseId: String(order.courseId) });
  }

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    await Order.updateOne({ _id: order._id, status: { $ne: "paid" } }, { status: "failed" });
    throw new HttpError(400, "Payment verification failed");
  }

  order.status = "paid";
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  await order.save();
  await enrollUser({ userId: user._id, courseId: order.courseId, orderId: order._id });

  return ok({ courseId: String(order.courseId) });
});
