import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { submissionService, analyticsService } from "../../services";
import { db, eq, and, isNull } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { TRPCError } from "@trpc/server";
import { createRateLimitMiddleware } from "../../middleware/rate-limit";

const submitRateLimit = createRateLimitMiddleware("public-submit", 60, 60 * 1000);
const progressRateLimit = createRateLimitMiddleware("public-progress", 120, 60 * 1000);
const startRateLimit = createRateLimitMiddleware("public-start", 120, 60 * 1000);

export const publicSubmitRouter = router({
  submit: publicProcedure
    .use(submitRateLimit)
    .meta({
      openapi: {
        method: "POST",
        path: "/public/submit/{slug}",
        tags: ["Public Submit"],
        summary: "Submit a response to a form",
        description: "Submits a complete form response. The `answers` object maps field UUIDs to their values. Server-side validation is performed against each field's type, required status, and custom validation rules (min/max, regex, allowed options). On success, triggers background jobs for email notifications and analytics updates. Rate limited to 60 submissions per minute per IP.",
      },
    })
    .input(
      z.object({
        slug: z.string(),
        answers: z.record(
          z.string().uuid(),
          z.union([
            z.string().max(10000),
            z.number(),
            z.boolean(),
            z.array(z.string().max(1000)).max(100),
            z.null(),
          ]),
        ),
        metadata: z
          .object({
            email: z.string().email().optional(),
            name: z.string().max(200).optional(),
            completionTimeSeconds: z.number().optional(),
            browserData: z.record(z.string(), z.unknown()).optional(),
          })
          .optional(),
      }),
    )
    .output(
      z.object({
        responseId: z.string().uuid(),
        successMessage: z.string(),
      }),
    )
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
    .use(progressRateLimit)
    .meta({
      openapi: {
        method: "POST",
        path: "/public/submit/{slug}/progress",
        tags: ["Public Submit"],
        summary: "Save progress for a multi-page form",
        description: "Saves partial answers for multi-page forms, enabling respondents to resume later and providing drop-off analytics. Uses a client-generated `sessionId` to track the in-progress response. Answers are validated but missing required fields on future pages are allowed. Rate limited to 120 requests per minute per IP.",
      },
    })
    .input(
      z.object({
        slug: z.string(),
        sessionId: z.string(),
        currentPage: z.number().int().min(1),
        answers: z.record(
          z.string().uuid(),
          z.union([
            z.string().max(10000),
            z.number(),
            z.boolean(),
            z.array(z.string().max(1000)).max(100),
            z.null(),
          ]),
        ),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fullMetadata = {
        ...input.metadata,
        ipHash: ctx.ipHash,
        userAgent: ctx.userAgent,
      };
      await submissionService.saveProgress(
        input.slug,
        input.sessionId,
        input.currentPage,
        input.answers,
        fullMetadata,
      );
      return { success: true };
    }),

  recordStart: publicProcedure
    .use(startRateLimit)
    .meta({
      openapi: {
        method: "POST",
        path: "/public/submit/{formId}/start",
        tags: ["Public Submit"],
        summary: "Record a form start event",
        description: "Records that a respondent has started interacting with a form (e.g., focused on the first field). Used to calculate completion rates and identify drop-offs. Only works for published forms. Rate limited to 120 requests per minute per IP.",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      const [form] = await db
        .select({ id: formsTable.id, status: formsTable.status })
        .from(formsTable)
        .where(and(eq(formsTable.id, input.formId), isNull(formsTable.deletedAt)))
        .limit(1);

      if (!form || form.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or not published" });
      }

      await analyticsService.recordStart(input.formId);
      return { success: true };
    }),
});
