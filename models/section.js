import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    position: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);
