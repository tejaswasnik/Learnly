import mongoose from "mongoose";
import { CATEGORIES, CURRENCIES } from "../lib/shared/constants.js";

const courseSchema = new mongoose.Schema(
  {
    courseTitle: { type: String, required: true, trim: true, maxlength: 120 },
    subTitle: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true },
    price: {
      amount: { type: Number, required: true, min: 0, default: 0 },
      currency: { type: String, enum: CURRENCIES, default: "INR" },
    },
    courseThumbnail: { type: String, required: true },
    thumbnailFileId: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

courseSchema.index({ isPublished: 1, createdAt: -1 });

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
