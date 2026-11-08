import mongoose from "mongoose";

// One collection for both: a question has parentId null, a reply points at its question. Replies are one level deep.
const qaPostSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "QaPost", default: null },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

qaPostSchema.index({ lectureId: 1, parentId: 1, createdAt: -1 });
qaPostSchema.index({ parentId: 1, createdAt: 1 });

export const QaPost = mongoose.models.QaPost || mongoose.model("QaPost", qaPostSchema);
