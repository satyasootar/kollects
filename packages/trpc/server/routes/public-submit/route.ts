import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { submissionService, analyticsService } from "../../services";

export const publicSubmitRouter = router({
  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: "/public/submit/{slug}", tags: ["Public Submit"], summary: "Submit a response to a form" } })
    .input(z.object({
      slug: z.string(),
      answers: z.record(z.string(), z.any()),
      metadata: z.object({
        email: z.string().email().optional(),
        name: z.string().optional(),
        completionTimeSeconds: z.number().optional(),
        browserData: z.record(z.string(), z.any()).optional(),
      }).optional(),
    }))
    .output(z.object({
      responseId: z.string().uuid(),
      successMessage: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Pass context info (like IP hash and User Agent) into metadata
      const fullMetadata = {
        ...input.metadata,
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
      };

      return submissionService.submit(input.slug, input.answers, fullMetadata);
    }),

  saveProgress: publicProcedure
    .meta({ openapi: { method: "POST", path: "/public/submit/{slug}/progress", tags: ["Public Submit"], summary: "Save progress for a multi-page form" } })
    .input(z.object({
      slug: z.string(),
      sessionId: z.string(),
      currentPage: z.number().int().min(1),
      answers: z.record(z.string(), z.any()),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .output(z.object({
      success: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fullMetadata = {
        ...input.metadata,
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
      };
      await submissionService.saveProgress(input.slug, input.sessionId, input.currentPage, input.answers, fullMetadata);
      return { success: true };
    }),

  recordStart: publicProcedure
    .meta({ openapi: { method: "POST", path: "/public/submit/{formId}/start", tags: ["Public Submit"], summary: "Record a form start event" } })
    .input(z.object({
      formId: z.string().uuid(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await analyticsService.recordStart(input.formId);
      return { success: true };
    }),
});
