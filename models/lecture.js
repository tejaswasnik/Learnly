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
    // Optional grouping. A lecture with no section (null) belongs to the unsectioned group, shown after all sections.
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", default: null },
    // Order within its group. Lectures created before sections existed have none and sort by createdAt, as before.
    position: { type: Number },
  },
  { timestamps: true },
);

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
