import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    // 0-100, kept in step with completedLectureIds. Readers recompute it from the lectures that exist now,
    // so adding or deleting lectures later never leaves a stale number on screen.
    progress: { type: Number, default: 0 },
    completedLectureIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    // The lecture the student was last on, so the player can resume there.
    lastLectureId: { type: mongoose.Schema.Types.ObjectId },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment =
  mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
