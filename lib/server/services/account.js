import crypto from "node:crypto";
import { connectDb } from "@/lib/server/db";
import { accountDeletedMessage } from "@/lib/server/email-templates";
import { HttpError } from "@/lib/server/http";
import { sendEmail } from "@/lib/server/services/email";
import { deleteCourseWithMedia } from "@/lib/server/services/instructor-courses";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/constants";
import { AuthToken } from "@/models/auth-token";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";

/**
 * Deletes an account by anonymizing it. Users are never hard-deleted: orders and enrollments are payment records
 * and keep pointing at the row. An instructor can leave only when none of their courses has students; their
 * courses, lectures and media are then removed first. The anonymizing save is last, so a failure midway leaves a
 * normal account that can simply retry, never an anonymized user with live courses.
 */
export async function deleteAccount(user) {
  await connectDb();
  const original = { name: user.name, email: user.email };

  if (user.role === "instructor") {
    const courses = await Course.find({ creator: user._id });
    if (courses.length > 0 && (await Enrollment.exists({ courseId: { $in: courses.map((c) => c._id) } }))) {
      throw new HttpError(409, "You have students enrolled in your courses. Unpublish them instead.");
    }
    for (const course of courses) await deleteCourseWithMedia(course);
  }

  user.name = "Deleted user";
  user.email = `deleted-${user._id}@learnly.invalid`;
  user.password = crypto.randomBytes(32).toString("hex"); // unusable; hashed by the pre-save hook
  user.photourl = DEFAULT_AVATAR_URL;
  user.emailVerified = false;
  user.emailVerifiedAt = undefined;
  user.tokenVersion += 1;
  user.deletedAt = new Date();
  await user.save();
  await AuthToken.deleteMany({ userId: user._id });

  await sendEmail({ to: original.email, ...accountDeletedMessage(original) }).catch((err) =>
    console.error("Account deleted notice not sent", err?.message),
  );
}
