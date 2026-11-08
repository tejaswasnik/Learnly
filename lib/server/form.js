import { HttpError } from "@/lib/server/http";

/** Reads a multipart request into plain string fields plus the named file (or null). */
export async function readMultipart(req, fileField) {
  let form;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Expected multipart form data");
  }
  const fields = {};
  let file = null;
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") fields[key] = value;
    else if (key === fileField) file = value;
  }
  return { fields, file };
}
