// One-off migration for Phase 2: accounts created before email verification existed are marked verified.
// Usage: MONGO_URI="mongodb+srv://..." node scripts/mark-existing-users-verified.mjs
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

await mongoose.connect(uri);
const result = await mongoose.connection
  .collection("users")
  .updateMany({ emailVerified: { $exists: false } }, { $set: { emailVerified: true, emailVerifiedAt: new Date() } });
console.log(`Marked ${result.modifiedCount} existing user(s) as verified.`);
await mongoose.disconnect();
