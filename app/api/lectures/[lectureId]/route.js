import { requireRole } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { HttpError, ok, parseId, withErrors } from "@/lib/server/http";
import { requireEnrollment } from "@/lib/server/services/enrollment";
import { deleteFile } from "@/lib/server/services/imagekit";
import { getOwnedLecture, serializePlayableLecture } from "@/lib/server/services/lectures";
import { Lecture } from "@/models/lecture";
import { QaPost } from "@/models/qa-post";

export const runtime = "nodejs";

export const GET = withErrors(async (req, { params }) => {
  const { lectureId } = await params;
  parseId(lectureId);
  await connectDb();
  const lecture = await Lecture.findById(lectureId).lean();
  if (!lecture) throw new HttpError(404, "Lecture not found");
  await requireEnrollment(req, String(lecture.courseId));
  return ok({ lecture: serializePlayableLecture(lecture) });
});

export const DELETE = withErrors(async (req, { params }) => {
  const user = await requireRole(req, "instructor");
  const { lectureId } = await params;
  const lecture = await getOwnedLecture(lectureId, user);
  await lecture.deleteOne();
  await QaPost.deleteMany({ lectureId: lecture._id }); // the questions were about this lecture
  await deleteFile(lecture.fileId);
  return ok({ message: "Lecture deleted" });
});
