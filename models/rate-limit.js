import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema({
  // `${rule}:${subject}:${windowStart}`; the window start makes each fixed window its own row.
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes the counter once its window has ended.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
