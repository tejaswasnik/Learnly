import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from "@/lib/shared/constants";

/** Client-side pre-check so the user gets instant feedback; the server still validates size, MIME and magic bytes. */
export function checkImage(file) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) return "Choose a JPEG, PNG or WebP image.";
  if (file.size > IMAGE_MAX_BYTES) return "This image is over 5 MB. Choose a smaller one.";
  return null;
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}
