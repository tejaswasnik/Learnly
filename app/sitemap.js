import { connectDb } from "@/lib/server/db";
import { siteUrl } from "@/lib/server/site-url";
import { Course } from "@/models/course";

export const dynamic = "force-dynamic";

/** Landing, the catalog, and published courses only. Drafts never appear. */
export default async function sitemap() {
  const base = siteUrl();
  const entries = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "daily", priority: 0.8 },
  ];
  try {
    await connectDb();
    const courses = await Course.find({ isPublished: true }).select("_id updatedAt").sort({ createdAt: -1 }).limit(5000).lean();
    for (const c of courses) {
      entries.push({ url: `${base}/courses/${c._id}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    // Without a database the sitemap still lists the static pages.
  }
  return entries;
}
