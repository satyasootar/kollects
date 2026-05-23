import { z } from "zod";

/**
 * UUID v4 string validation schema.
 */
export const uuidSchema = z.string().uuid();

/**
 * Slug validation schema.
 * Rules: 4-64 chars, lowercase alphanumeric + hyphens, cannot start/end with hyphen.
 */
export const slugSchema = z
  .string()
  .min(4, "Slug must be at least 4 characters")
  .max(64, "Slug must be at most 64 characters")
  .regex(
    /^[a-z0-9][a-z0-9-]{2,62}[a-z0-9]$/,
    "Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen"
  );

/**
 * Offset-based pagination input schema.
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Date range filter schema.
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
