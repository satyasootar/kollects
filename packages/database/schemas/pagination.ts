import { z } from "zod";

/**
 * Offset-based pagination input schema.
 */
export const offsetPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Cursor-based pagination input schema.
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Sort direction enum.
 */
export const sortDirectionSchema = z.enum(["asc", "desc"]).default("desc");
