import { connectDb } from "@/lib/server/db";
import { enrollUser } from "@/lib/server/services/enrollment";
import { Order } from "@/models/order";

/**
 * Marks an order paid and enrolls its buyer. Safe to call any number of times and concurrently
 * (checkout verification and the webhook both land here): only one caller flips the status, and every
 * call makes sure the enrollment exists, so a crash between "paid" and "enrolled" heals on the next call.
 */
export async function settleOrder({ order, paymentId, signature }) {
  await connectDb();
  const update = { status: "paid", razorpayPaymentId: paymentId };
  if (signature) update.razorpaySignature = signature;

  const won = await Order.findOneAndUpdate({ _id: order._id, status: { $ne: "paid" } }, update, { new: true });
  const settled = won ?? (await Order.findById(order._id));
  await enrollUser({ userId: settled.userId, courseId: settled.courseId, orderId: settled._id });
  return { courseId: String(settled.courseId), alreadyPaid: !won };
}
