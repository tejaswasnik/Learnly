import { requireVerified } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseBody, parseId, withErrors } from "@/lib/server/http";
import { enrollUser, isEnrolled } from "@/lib/server/services/enrollment";
import { getRazorpay } from "@/lib/server/services/razorpay";
import { createOrderSchema } from "@/lib/server/validators/payment";
import { Course } from "@/models/course";
import { Order } from "@/models/order";

export const runtime = "nodejs";

export const POST = withErrors(async (req) => {
  const user = await requireVerified(req);
  const { courseId } = await parseBody(createOrderSchema, req);
  parseId(courseId);
  await connectDb();

  // The price always comes from the database, never from the client.
  const course = await Course.findById(courseId).lean();
  if (!course || !course.isPublished) throw new HttpError(404, "Course not found");
  if (await isEnrolled(user._id, course._id)) throw new HttpError(409, "You are already enrolled in this course");

  if (course.price.amount === 0) {
    await enrollUser({ userId: user._id, courseId: course._id });
    return ok({ enrolled: true, courseId: String(course._id) });
  }

  // Razorpay amounts are in the currency's smallest unit (paise, cents).
  const amount = Math.round(course.price.amount * 100);
  let order;
  try {
    order = await getRazorpay().orders.create({
      amount,
      currency: course.price.currency,
      receipt: `lrn_${Date.now().toString(36)}${String(user._id).slice(-6)}`,
      notes: { courseId: String(course._id), userId: String(user._id) },
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    throw new HttpError(502, "We couldn’t start the payment. Please try again.");
  }

  await Order.create({
    userId: user._id,
    courseId: course._id,
    razorpayOrderId: order.id,
    amount,
    currency: course.price.currency,
    status: "created",
  });

  return ok({
    orderId: order.id,
    amount,
    currency: course.price.currency,
    keyId: getConfig().RAZORPAY_KEY_ID,
  });
});
