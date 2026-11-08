import { HttpError } from "@/lib/server/http";
import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from "@/lib/shared/constants";

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const startsWith = (bytes, signature, offset = 0) => signature.every((b, i) => bytes[offset + i] === b);

/** Detects the real image type from the file's first bytes (never trusts the filename or declared MIME). */
export function detectImageType(bytes) {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/**
 * Validates an uploaded image: size, declared MIME and magic bytes (all must agree).
 * Returns { buffer, mimeType, extension } so the caller does not read the file twice.
 */
export async function validateImageFile(file) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new HttpError(400, "An image file is required");
  }
  if (file.size > IMAGE_MAX_BYTES) throw new HttpError(400, "Image must be 5 MB or smaller");
  if (!IMAGE_MIME_TYPES.includes(file.type)) throw new HttpError(400, "Image must be a JPEG, PNG or WebP file");

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(buffer);
  if (!detected || detected !== file.type) {
    throw new HttpError(400, "File content does not match a valid JPEG, PNG or WebP image");
  }
  return { buffer, mimeType: detected, extension: EXTENSIONS[detected] };
}
