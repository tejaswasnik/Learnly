import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  // The token's own expiry: once it has passed the token is dead anyway, so the row can go.
  expiresAt: { type: Date, required: true },
});

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);
