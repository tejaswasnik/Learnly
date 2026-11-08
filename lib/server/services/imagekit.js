import ImageKit, { toFile } from "@imagekit/nodejs";
import { getConfig } from "@/lib/server/config";
import { HttpError } from "@/lib/server/http";

let client;

export function getImageKit() {
  if (!client) client = new ImageKit({ privateKey: getConfig().IMAGEKIT_PRIVATE_KEY });
  return client;
}

/** Time-limited signed URL for a file stored in ImageKit (path as returned at upload, e.g. "/lectures/a.mp4"). */
export function signedUrl(filePath, expiresInSeconds = 3600) {
  return getImageKit().helper.buildSrc({
    src: filePath,
    urlEndpoint: getConfig().IMAGEKIT_URL_ENDPOINT,
    signed: true,
    expiresIn: expiresInSeconds,
  });
}

/** Uploads a validated image buffer to ImageKit. Returns { url, fileId }. */
export async function uploadImage({ buffer, mimeType, extension }, folder) {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  try {
    const res = await getImageKit().files.upload({
      file: await toFile(buffer, fileName, { type: mimeType }),
      fileName,
      folder,
      useUniqueFileName: true,
    });
    return { url: res.url, fileId: res.fileId };
  } catch (err) {
    console.error("ImageKit upload failed", err);
    throw new HttpError(502, "Image upload failed. Please try again.");
  }
}

/** Deletes a file from ImageKit. A file that is already gone is not an error; other failures are logged, not thrown. */
export async function deleteFile(fileId) {
  if (!fileId) return;
  try {
    await getImageKit().files.delete(fileId);
  } catch (err) {
    if (err?.status === 404) return;
    console.error(`ImageKit delete failed for ${fileId}`, err);
  }
}
