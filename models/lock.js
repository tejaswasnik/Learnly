import mongoose from "mongoose";

const lockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  // Safety net: if a run dies without releasing, MongoDB clears the lock after it has expired.
  expiresAt: { type: Date, required: true },
});

lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Lock = mongoose.models.Lock || mongoose.model("Lock", lockSchema);
