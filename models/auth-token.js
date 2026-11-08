import mongoose from "mongoose";

export const TOKEN_TYPES = ["verify-email", "reset-password"];

const authTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: TOKEN_TYPES, required: true },
    // Only the SHA-256 of the emailed token is stored, so a database leak cannot be replayed.
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// MongoDB deletes the row once expiresAt has passed.
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken = mongoose.models.AuthToken || mongoose.model("AuthToken", authTokenSchema);
