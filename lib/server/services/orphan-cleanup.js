import { connectDb } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { deleteFile, getImageKit } from "@/lib/server/services/imagekit";
import { Course } from "@/models/course";
import { Lecture } from "@/models/lecture";
import { Lock } from "@/models/lock";
import { User } from "@/models/user";

// Only these folders are ever touched. Lecture videos are uploaded from the browser to /lectures; thumbnails go to /courses.
const APP_FOLDERS = ["/lectures", "/courses", "/avatars"];
const PAGE_SIZE = 500;
const LOCK_NAME = "orphan-cleanup";
const LOCK_TTL_MS = 10 * 60 * 1000;

async function acquireLock() {
  await connectDb();
  try {
    await Lock.create({ name: LOCK_NAME, expiresAt: new Date(Date.now() + LOCK_TTL_MS) });
  } catch (err) {
    if (err?.code === 11000) {
      // An expired lock that MongoDB has not swept yet does not block a new run.
      const taken = await Lock.findOneAndUpdate(
        { name: LOCK_NAME, expiresAt: { $lte: new Date() } },
        { expiresAt: new Date(Date.now() + LOCK_TTL_MS) },
      );
      if (taken) return;
      throw new HttpError(409, "A cleanup is already running");
    }
    throw err;
  }
}

async function* listFolder(folder) {
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await getImageKit().assets.list({ path: folder, type: "file", fileType: "all", skip, limit: PAGE_SIZE, sort: "ASC_CREATED" });
    for (const item of page) yield item;
    if (page.length < PAGE_SIZE) return;
  }
}

const isReferenced = async (fileId) =>
  Boolean(
    (await Lecture.exists({ fileId })) ||
      (await Course.exists({ thumbnailFileId: fileId })) ||
      (await User.exists({ avatarFileId: fileId })),
  );

/**
 * Finds files in the app's ImageKit folders that no lecture or course points at and that are older than
 * graceHours (so an upload still in progress is never touched). Dry run unless apply is true. At most maxDeletes
 * files are deleted per run; each candidate is re-checked against the database right before deletion.
 */
export async function cleanupOrphans({ apply = false, graceHours = 24, maxDeletes = 100 } = {}) {
  await acquireLock();
  try {
    const [lectureIds, thumbnailIds, avatarIds] = await Promise.all([
      Lecture.distinct("fileId", { fileId: { $exists: true, $ne: null } }),
      Course.distinct("thumbnailFileId", { thumbnailFileId: { $exists: true, $ne: null } }),
      User.distinct("avatarFileId", { avatarFileId: { $exists: true, $ne: null } }),
    ]);
    const referenced = new Set([...lectureIds, ...thumbnailIds, ...avatarIds]);
    const cutoff = Date.now() - graceHours * 60 * 60 * 1000;

    const summary = { scanned: 0, referenced: 0, orphans: 0, deleted: 0, skippedRecent: 0, truncated: false };
    const candidates = [];
    for (const folder of APP_FOLDERS) {
      for await (const file of listFolder(folder)) {
        // Defense in depth: never act on anything outside the app's folders, even if the listing returns it.
        if (!file.fileId || !file.filePath?.startsWith(`${folder}/`)) continue;
        summary.scanned += 1;
        if (referenced.has(file.fileId)) {
          summary.referenced += 1;
          continue;
        }
        const created = Date.parse(file.createdAt);
        if (!Number.isFinite(created) || created > cutoff) {
          summary.skippedRecent += 1; // unknown age counts as recent: when in doubt, keep
          continue;
        }
        candidates.push(file);
      }
    }

    summary.orphans = candidates.length;
    summary.truncated = apply && candidates.length > maxDeletes;
    if (apply) {
      for (const file of candidates.slice(0, maxDeletes)) {
        if (await isReferenced(file.fileId)) continue; // attached since the listing started
        await deleteFile(file.fileId);
        summary.deleted += 1;
      }
    }
    console.log(`Orphan cleanup (${apply ? "apply" : "dry run"}): ${JSON.stringify(summary)}`);
    return summary;
  } finally {
    await Lock.deleteOne({ name: LOCK_NAME }).catch(() => {});
  }
}
