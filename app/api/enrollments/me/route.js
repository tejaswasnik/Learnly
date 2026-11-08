import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { ok, withErrors } from "@/lib/server/http";
import { Enrollment } from "@/models/enrollment";

export const runtime = "nodejs";

export const GET = withErrors(async (req) => {
  const user = await requireUser(req);
  await connectDb();

  const rows = await Enrollment.find({ userId: user._id })
    .sort({ enrolledAt: -1 })
    .populate({ path: "courseId", populate: { path: "creator", select: "name" } })
    .lean();

  const enrollments = rows
    .filter((r) => r.courseId) // the course may have been removed
    .map((r) => ({
      enrolledAt: r.enrolledAt.toISOString(),
      course: {
        id: String(r.courseId._id),
        courseTitle: r.courseId.courseTitle,
        subTitle: r.courseId.subTitle ?? "",
        category: r.courseId.category,
        price: { amount: r.courseId.price.amount, currency: r.courseId.price.currency },
        courseThumbnail: r.courseId.courseThumbnail,
        creator: { name: r.courseId.creator?.name ?? "Unknown" },
      },
    }));

  return ok({ enrollments });
});
