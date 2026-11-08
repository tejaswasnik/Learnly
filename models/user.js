import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ALL_ROLES, DEFAULT_AVATAR_URL } from "../lib/shared/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, default: "student" },
    photourl: { type: String, default: DEFAULT_AVATAR_URL },
    // ImageKit file id of an uploaded avatar, so it can be deleted on replace, remove and account deletion.
    avatarFileId: { type: String },
    tokenVersion: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    // Set when the account is deleted (anonymized). Orders and enrollments keep pointing at the row.
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
