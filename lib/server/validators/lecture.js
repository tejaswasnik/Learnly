import { z } from "zod";

const fields = {
  lectureTitle: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  description: z.string().trim().max(2000).optional(),
  duration: z.number().int().min(0, "Duration cannot be negative"),
  videoUrl: z.url("Enter a valid URL").optional(),
  fileId: z.string().min(1).optional(),
  filePath: z.string().min(1).optional(),
};

const hasExactlyOneSource = (v) => {
  const external = Boolean(v.videoUrl);
  const uploaded = Boolean(v.fileId && v.filePath);
  const partialUpload = Boolean(v.fileId) !== Boolean(v.filePath);
  return external !== uploaded && !partialUpload;
};

const sourceError = {
  path: ["videoUrl"],
  message: "Provide either a video URL or an uploaded file, not both or neither",
};

export const createLectureSchema = z
  .object({
    courseId: z.string().min(1),
    ...fields,
    isPreviewFree: z.boolean().default(false),
  })
  .refine(hasExactlyOneSource, sourceError);

// Every field is optional on update, but a supplied video source must still be exactly one.
export const updateLectureSchema = z
  .object({
    lectureTitle: fields.lectureTitle.optional(),
    description: fields.description,
    duration: fields.duration.optional(),
    isPreviewFree: z.boolean().optional(),
    videoUrl: fields.videoUrl,
    fileId: fields.fileId,
    filePath: fields.filePath,
  })
  .refine((v) => !(v.videoUrl || v.fileId || v.filePath) || hasExactlyOneSource(v), sourceError);
