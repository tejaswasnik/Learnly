import { z } from "zod";
import { CATEGORIES, CURRENCIES } from "../../shared/constants.js";

const title = z.string().trim().min(3, "Title must be at least 3 characters").max(120);
const amount = z.coerce.number("Price must be a number").min(0, "Price cannot be negative");
const booleanish = z.preprocess(
  (v) => (v === "true" ? true : v === "false" ? false : v),
  z.boolean(),
);

export const createCourseSchema = z.object({
  courseTitle: title,
  subTitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  category: z.enum(CATEGORIES),
  currency: z.enum(CURRENCIES).default("INR"),
  price: amount,
});

// Every field is optional. An empty string for subTitle/description is valid and means "clear it".
export const updateCourseSchema = z.object({
  courseTitle: title.optional(),
  subTitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  category: z.enum(CATEGORIES).optional(),
  currency: z.enum(CURRENCIES).optional(),
  price: amount.optional(),
  isPublished: booleanish.optional(),
});
