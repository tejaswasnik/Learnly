import { requireUser } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { ok, withErrors } from "@/lib/server/http";
import { progressForEnrollments } from "@/lib/server/services/progress";
import { Enrollment } from "@/models/enrollment";

export const runtime = "nodejs";

export const GET = withErrors(async (req) => {
  const user = await requireUser(req);
  await connectDb();

  const rows = await Enrollment.find({ userId: user._id })
    .sort({ enrolledAt: -1 })
    .populate({ path: "courseId", populate: { path: "creator", select: "name" } })
    .lean();

  const live = rows.filter((r) => r.courseId); // the course may have been removed
  const progress = await progressForEnrollments(live);
  for (const p of progress.values()) delete p.completedLectureIds; // the dashboard only needs the numbers

  const enrollments = live
    .map((r) => ({
      enrolledAt: r.enrolledAt.toISOString(),
      progress: progress.get(String(r._id)),
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
