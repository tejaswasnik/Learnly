import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ALL_ROLES, DEFAULT_AVATAR_URL } from "../lib/shared/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    // false for accounts created through Google: nobody knows the random password, so these users may set one
    // (or delete the account) without entering a "current" password. Existing accounts default to true.
    passwordSet: { type: Boolean, default: true },
    role: { type: String, enum: ALL_ROLES, default: "student" },
    photourl: { type: String, default: DEFAULT_AVATAR_URL },
    // Google account id (the OIDC `sub`) once the user has signed in with Google. Unique when present.
    googleId: { type: String, unique: true, sparse: true },
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
