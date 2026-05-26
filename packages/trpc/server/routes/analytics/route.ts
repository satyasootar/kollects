import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { analyticsService } from "../../services";

export const analyticsRouter = router({
  getOverview: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/overview",
        tags: ["Analytics"],
        summary: "Get form overview analytics",
        description: "Returns high-level analytics counters for a form: total views, total starts, total submissions, and completion rate (percentage). Data is cached for 5 minutes. Requires form ownership.",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
      }),
    )
    .output(
      z.object({
        totalViews: z.number(),
        totalStarts: z.number(),
        totalSubmissions: z.number(),
        completionRate: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return analyticsService.getOverview(ctx.user.id, input.formId);
    }),

  getDailyStats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/daily",
        tags: ["Analytics"],
        summary: "Get daily analytics stats",
        description: "Returns time-series analytics data for a date range. Each entry includes daily views, starts, submissions, completion rate, average completion time, bounces, and drop-offs. Use ISO 8601 datetime strings for `startDate` and `endDate`. Requires form ownership.",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .output(
      z.array(
        z.object({
          date: z.date(),
          views: z.number(),
          starts: z.number(),
          submissions: z.number(),
          completionRate: z.number(),
          avgCompletionTimeSeconds: z.number(),
          bounces: z.number(),
          dropoffs: z.number(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      return analyticsService.getDailyStats(
        ctx.user.id,
        input.formId,
        new Date(input.startDate),
        new Date(input.endDate),
      );
    }),

  getDropoffByPage: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/dropoffs",
        tags: ["Analytics"],
        summary: "Get drop-offs by page",
        description: "Returns the number of incomplete responses grouped by the last completed page. Useful for identifying which pages cause respondents to abandon the form. Requires form ownership.",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
      }),
    )
    .output(
      z.array(
        z.object({
          page: z.number(),
          dropoffs: z.number(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      return analyticsService.getDropoffByPage(ctx.user.id, input.formId);
    }),

  getFieldStats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/fields/{fieldId}",
        tags: ["Analytics"],
        summary: "Get statistics for a specific field",
        description: "Returns aggregated answer statistics for a specific field. Stats vary by field type: ratings return average + distribution, select fields return option counts, numbers return min/max/average, checkboxes return true/false counts, text fields return total count. Only includes answers from completed responses. Requires form ownership.",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
        fieldId: z.string().uuid(),
      }),
    )
    .output(
      z.object({
        type: z.string(),
        totalAnswers: z.number(),
        stats: z.any().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return analyticsService.getFieldStats(ctx.user.id, input.formId, input.fieldId);
    }),
});
