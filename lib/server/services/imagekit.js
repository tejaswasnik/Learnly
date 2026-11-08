import ImageKit from "@imagekit/nodejs";
import { getConfig } from "@/lib/server/config";

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
