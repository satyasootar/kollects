import { z } from "zod";
import { protectedProcedure, router } from "../../../server/trpc";
import { generatePath } from "../../../server/utils/path-generator";
import { responseService } from "../../../server/services";
import { paginationSchema } from "@repo/database/schemas/common";

const TAGS = ["Responses"];
const getPath = generatePath("/responses");

// Create schema locally because response.ts schema is not fully defined yet
const responseSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  submittedAt: z.date().nullable(),
  isComplete: z.boolean(),
  completionTimeSeconds: z.number().nullable(),
  ipHash: z.string().nullable(),
  userAgent: z.string().nullable(),
});

export const responseRouter = router({
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}"), tags: TAGS, summary: "List responses for a form" } })
    .input(z.object({
      formId: z.string().uuid(),
      ...paginationSchema.shape,
    }))
    .output(z.object({
      responses: z.array(responseSchema),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return responseService.list(ctx.user!.id, input.formId, input.page, input.limit);
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{responseId}/details"), tags: TAGS, summary: "Get a specific response with answers" } })
    .input(z.object({
      responseId: z.string().uuid(),
    }))
    .output(responseSchema.extend({
      answers: z.array(z.object({
        id: z.string().uuid(),
        fieldId: z.string().uuid(),
        value: z.any(),
        field: z.object({
          id: z.string().uuid(),
          type: z.string(),
          label: z.string(),
        }).optional(),
      })),
    }))
    .query(async ({ ctx, input }) => {
      return responseService.getById(ctx.user!.id, input.responseId);
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{responseId}"), tags: TAGS, summary: "Delete a response" } })
    .input(z.object({
      responseId: z.string().uuid(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await responseService.delete(ctx.user!.id, input.responseId);
      return { success: true };
    }),

  exportCsv: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}/export"), tags: TAGS, summary: "Export all responses as CSV" } })
    .input(z.object({
      formId: z.string().uuid(),
    }))
    .output(z.string())
    .query(async ({ ctx, input }) => {
      return responseService.exportCsv(ctx.user!.id, input.formId);
    }),
});
