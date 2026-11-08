import { ImageKitAbortError, upload } from "@imagekit/javascript";
import { api } from "@/lib/client/api";
import { VIDEO_MAX_BYTES } from "@/lib/shared/constants";
import { formatBytes } from "@/lib/client/image-check";

/** Instant client-side check; the player and ImageKit enforce the real limits. Returns an error message or null. */
export function checkVideo(file) {
  if (!file.type.startsWith("video/")) return "Choose a video file (MP4 or WebM).";
  if (file.size > VIDEO_MAX_BYTES) {
    return `That file is ${formatBytes(file.size)}. Choose a video under 500 MB.`;
  }
  return null;
}

/** Reads the video's length in whole seconds from its metadata, without uploading anything. */
export function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (fn, value) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      fn(value);
    };
    video.onloadedmetadata = () => done(resolve, Number.isFinite(video.duration) ? Math.round(video.duration) : 0);
    video.onerror = () => done(reject, new Error("Could not read the video"));
    video.src = url;
  });
}

/**
 * Uploads straight from the browser to ImageKit using short-lived parameters from our server,
 * so the video never passes through /api and the private key never reaches the client.
 */
export async function uploadVideo({ file, onProgress, signal }) {
  const auth = await api("/lectures/upload-auth", { signal });
  const res = await upload({
    file,
    fileName: file.name,
    folder: "/lectures",
    useUniqueFileName: true,
    token: auth.token,
    signature: auth.signature,
    expire: auth.expire,
    publicKey: auth.publicKey,
    abortSignal: signal,
    onProgress: (e) => onProgress?.(e.loaded, e.total),
  });
  return { fileId: res.fileId, filePath: res.filePath };
}

export const isAbort = (err) => err instanceof ImageKitAbortError || err?.name === "AbortError";
