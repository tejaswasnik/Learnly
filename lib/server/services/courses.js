import { connectDb } from "@/lib/server/db";
import { loadCurriculum, serializeSection } from "@/lib/server/services/curriculum";
import { HttpError, parseId } from "@/lib/server/http";
import { signedUrl } from "@/lib/server/services/imagekit";
import { MAX_PAGE_SIZE, PAGE_SIZE } from "@/lib/shared/constants";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { "price.amount": 1, createdAt: -1 },
  price_desc: { "price.amount": -1, createdAt: -1 },
};

async function enrolledCounts(courseIds) {
  if (courseIds.length === 0) return new Map();
  const rows = await Enrollment.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: "$courseId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

const toCreator = (u) => ({ name: u?.name ?? "Unknown", photourl: u?.photourl ?? null });

/** Published courses only, always. Never returns student ids or the thumbnail file id. */
export async function listPublishedCourses({ search, category, sort = "newest", page = 1, limit = PAGE_SIZE } = {}) {
  await connectDb();

  const safeLimit = Math.min(Math.max(Math.floor(limit) || PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Math.floor(page) || 1, 1);

  const filter = { isPublished: true };
  if (category) filter.category = category;
  const term = search?.trim();
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ courseTitle: rx }, { subTitle: rx }, { category: rx }];
  }

  const [total, docs] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort(SORTS[sort] ?? SORTS.newest)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("creator", "name photourl")
      .lean(),
  ]);

  const counts = await enrolledCounts(docs.map((c) => c._id));

  return {
    courses: docs.map((c) => ({
      id: String(c._id),
      courseTitle: c.courseTitle,
      subTitle: c.subTitle ?? "",
      category: c.category,
      price: { amount: c.price.amount, currency: c.price.currency },
      courseThumbnail: c.courseThumbnail,
      creator: toCreator(c.creator),
      enrolledCount: counts.get(String(c._id)) ?? 0,
      createdAt: c.createdAt.toISOString(),
    })),
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    total,
  };
}

/**
 * Course page data. 404 unless published, or the viewer is the creator or an admin.
 * Locked lectures never carry a URL; only isPreviewFree lectures do.
 */
export async function getCourseDetails(courseId, viewer) {
  parseId(courseId);
  await connectDb();

  const course = await Course.findById(courseId).populate("creator", "name photourl").lean();
  if (!course) throw new HttpError(404, "Course not found");

  const viewerId = viewer ? String(viewer._id) : null;
  const isOwner = viewerId !== null && String(course.creator?._id) === viewerId;
  const isAdmin = viewer?.role === "admin";
  if (!course.isPublished && !isOwner && !isAdmin) throw new HttpError(404, "Course not found");

  const [{ sections, lectures }, enrolledCount, enrollment] = await Promise.all([
    loadCurriculum(course._id),
    Enrollment.countDocuments({ courseId: course._id }),
    viewerId ? Enrollment.exists({ courseId: course._id, userId: viewerId }) : null,
  ]);

  const isEnrolled = Boolean(enrollment);

  return {
    id: String(course._id),
    courseTitle: course.courseTitle,
    subTitle: course.subTitle ?? "",
    description: course.description ?? "",
    category: course.category,
    price: { amount: course.price.amount, currency: course.price.currency },
    courseThumbnail: course.courseThumbnail,
    isPublished: course.isPublished,
    creator: toCreator(course.creator),
    enrolledCount,
    isEnrolled,
    isOwner,
    canAccess: isEnrolled || isOwner || isAdmin,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    sections: sections.map(serializeSection),
    lectures: lectures.map((l) => {
      const base = {
        id: String(l._id),
        sectionId: l.sectionId ? String(l.sectionId) : null,
        lectureTitle: l.lectureTitle,
        duration: l.duration,
        isPreviewFree: l.isPreviewFree,
      };
      if (!l.isPreviewFree) return base;
      return {
        ...base,
        videoUrl: l.fileId ? signedUrl(l.filePath, 3600) : l.videoUrl,
        isExternal: !l.fileId,
      };
    }),
  };
}
