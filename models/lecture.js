import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    duration: { type: Number, default: 0, min: 0 },
    videoUrl: { type: String, trim: true },
    fileId: { type: String },
    filePath: { type: String },
    isPreviewFree: { type: Boolean, default: false },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  },
  { timestamps: true },
);

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
