import { VERIFY_FIRST_MESSAGE } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { HttpError, parseId } from "@/lib/server/http";
import { Course } from "@/models/course";
import { Lecture } from "@/models/lecture";
import { QaPost } from "@/models/qa-post";
import { User } from "@/models/user";

export const QUESTIONS_PER_PAGE = 20;

/** Anything a person publishes needs a verified email (admins are exempt), as with buying and publishing. */
export function assertCanPost(user) {
  if (!user.emailVerified && user.role !== "admin") throw new HttpError(403, VERIFY_FIRST_MESSAGE);
}

export async function getLectureOr404(lectureId) {
  parseId(lectureId);
  await connectDb();
  const lecture = await Lecture.findById(lectureId).select("courseId").lean();
  if (!lecture) throw new HttpError(404, "Lecture not found");
  return lecture;
}

const canDelete = (post, viewer, course) =>
  String(post.authorId) === String(viewer._id) || String(course.creator) === String(viewer._id) || viewer.role === "admin";

function serializePost(post, authors, viewer, course) {
  const author = authors.get(String(post.authorId));
  return {
    id: String(post._id),
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: String(post.authorId),
      name: author?.name ?? "Deleted user",
      photourl: author?.photourl ?? null,
      isInstructor: String(post.authorId) === String(course.creator),
    },
    isMine: String(post.authorId) === String(viewer._id),
    canDelete: canDelete(post, viewer, course),
  };
}

async function authorsOf(posts) {
  const ids = [...new Set(posts.map((p) => String(p.authorId)))];
  const users = await User.find({ _id: { $in: ids } }).select("name photourl").lean();
  return new Map(users.map((u) => [String(u._id), u]));
}

/** Questions for one lecture, newest first, each with its replies oldest first. Paged by question. */
export async function listQuestions({ lectureId, courseId, viewer, page = 1 }) {
  await connectDb();
  const course = await Course.findById(courseId).select("creator").lean();
  const filter = { lectureId, parentId: null };
  const [total, questions] = await Promise.all([
    QaPost.countDocuments(filter),
    QaPost.find(filter).sort({ createdAt: -1 }).skip((page - 1) * QUESTIONS_PER_PAGE).limit(QUESTIONS_PER_PAGE).lean(),
  ]);
  const replies = questions.length > 0 ? await QaPost.find({ parentId: { $in: questions.map((q) => q._id) } }).sort({ createdAt: 1 }).lean() : [];
  const authors = await authorsOf([...questions, ...replies]);

  return {
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE)),
    questions: questions.map((q) => ({
      ...serializePost(q, authors, viewer, course),
      replies: replies.filter((r) => String(r.parentId) === String(q._id)).map((r) => serializePost(r, authors, viewer, course)),
    })),
  };
}

export async function createPost({ user, lecture, parentId = null, body }) {
  await connectDb();
  const post = await QaPost.create({ courseId: lecture.courseId, lectureId: lecture._id, authorId: user._id, parentId, body });
  const course = await Course.findById(lecture.courseId).select("creator").lean();
  const post1 = post.toObject();
  return { ...serializePost(post1, await authorsOf([post1]), user, course), replies: [] };
}

/** A question the caller is replying to: it must exist, be a question (not a reply), and give us its lecture. */
export async function getQuestionOr404(postId) {
  parseId(postId);
  await connectDb();
  const question = await QaPost.findById(postId).lean();
  if (!question || question.parentId) throw new HttpError(404, "Question not found");
  const lecture = await Lecture.findById(question.lectureId).select("courseId").lean();
  if (!lecture) throw new HttpError(404, "Question not found");
  return { question, lecture };
}

/** Author or the course's instructor (or an admin) may delete. Deleting a question deletes its replies with it. */
export async function deletePost({ postId, viewer }) {
  parseId(postId);
  await connectDb();
  const post = await QaPost.findById(postId).lean();
  if (!post) throw new HttpError(404, "Post not found");
  const course = await Course.findById(post.courseId).select("creator").lean();
  if (!course || !canDelete(post, viewer, course)) throw new HttpError(403, "You can only delete your own posts");
  await QaPost.deleteMany({ $or: [{ _id: post._id }, { parentId: post._id }] });
}
