import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function ok(data = {}, init) {
  return NextResponse.json({ success: true, ...data }, init);
}

export function fail(message, status = 400, errors) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return NextResponse.json(body, { status });
}

function zodErrors(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fields[key] ||= []).push(issue.message);
  }
  return fields;
}

export function withErrors(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status, err.errors);
      if (err instanceof ZodError) return fail("Validation failed", 400, zodErrors(err));
      console.error(err);
      const message =
        process.env.NODE_ENV === "production" ? "Something went wrong" : err?.message || "Server error";
      return fail(message, 500);
    }
  };
}

export async function parseBody(schema, req) {
  let json;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new HttpError(400, "Validation failed", zodErrors(result.error));
  return result.data;
}

export function parseId(value) {
  if (typeof value !== "string" || !mongoose.isValidObjectId(value) || String(new mongoose.Types.ObjectId(value)) !== value.toLowerCase()) {
    throw new HttpError(400, "Invalid id");
  }
  return value;
}
