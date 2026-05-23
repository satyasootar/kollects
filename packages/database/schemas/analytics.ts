import { z } from "zod";
import { uuidSchema, dateRangeSchema } from "./common";

/**
 * Analytics query input schema.
 */
export const analyticsQuerySchema = z.object({
  formId: uuidSchema,
  ...dateRangeSchema.shape,
});

/**
 * Daily stats output schema.
 */
export const dailyStatsSchema = z.object({
  date: z.string(),
  views: z.number().int(),
  starts: z.number().int(),
  submissions: z.number().int(),
  completionRate: z.number(),
  avgCompletionTimeSeconds: z.number(),
  bounces: z.number().int(),
  dropoffs: z.number().int(),
});
