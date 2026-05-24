import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { submissionService } from "../../services";

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
      answers: z.record(z.string(), z.any()),
    }))
    .output(z.object({
      responseId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      // Stub implementation for Phase 10
      // In a real scenario, this would use UPSERT logic in SubmissionService
      return { responseId: undefined };
    }),
});
