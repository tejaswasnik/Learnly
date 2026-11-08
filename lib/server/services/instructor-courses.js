import { connectDb } from "@/lib/server/db";
import { HttpError, parseId } from "@/lib/server/http";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Lecture } from "@/models/lecture";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Loads a course and checks that the user is its creator: 404 if missing, 403 if someone else's. */
export async function getOwnedCourse(courseId, user) {
  parseId(courseId);
  await connectDb();
  const course = await Course.findById(courseId);
  if (!course) throw new HttpError(404, "Course not found");
  if (String(course.creator) !== String(user._id)) throw new HttpError(403, "You can only manage your own courses");
  return course;
}

/** Course as returned to its owner. Never includes thumbnailFileId. */
export function serializeOwnedCourse(course, extra = {}) {
  return {
    id: String(course._id),
    courseTitle: course.courseTitle,
    subTitle: course.subTitle ?? "",
    description: course.description ?? "",
    category: course.category,
    price: { amount: course.price.amount, currency: course.price.currency },
    courseThumbnail: course.courseThumbnail,
    isPublished: course.isPublished,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    ...extra,
  };
}

async function countsBy(Model, courseIds) {
  if (courseIds.length === 0) return new Map();
  const rows = await Model.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: "$courseId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

/**
 * The instructor's own courses (filtered and paged) plus totals over ALL of their courses,
 * so the dashboard stat cards stay correct on page 2 or with a filter applied.
 */
export async function listInstructorCourses(user, { search, status = "all", page = 1, limit = 12 }) {
  await connectDb();

  const mine = { creator: user._id };
  const filter = { ...mine };
  if (status === "published") filter.isPublished = true;
  if (status === "draft") filter.isPublished = false;
  const term = search?.trim();
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ courseTitle: rx }, { subTitle: rx }, { category: rx }];
  }

  const [allIds, total, docs] = await Promise.all([
    Course.find(mine).select("_id isPublished").lean(),
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const pageIds = docs.map((c) => c._id);
  const [enrolled, lectures, students] = await Promise.all([
    countsBy(Enrollment, pageIds),
    countsBy(Lecture, pageIds),
    Enrollment.countDocuments({ courseId: { $in: allIds.map((c) => c._id) } }),
  ]);

  return {
    courses: docs.map((c) =>
      serializeOwnedCourse(c, {
        enrolledCount: enrolled.get(String(c._id)) ?? 0,
        lectureCount: lectures.get(String(c._id)) ?? 0,
      }),
    ),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
    totals: {
      courses: allIds.length,
      published: allIds.filter((c) => c.isPublished).length,
      students,
    },
  };
}
