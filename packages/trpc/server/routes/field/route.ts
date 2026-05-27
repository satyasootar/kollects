import { z } from "zod";
import { protectedProcedure, scopedProcedure, router } from "../../trpc";
import { fieldService } from "../../services";
import {
  createFieldSchema,
  updateFieldSchema,
  reorderFieldsSchema,
} from "@repo/database/schemas/field";
import { FIELD_TYPES } from "@repo/database/constants/field-types";

export const fieldRouter = router({
  create: scopedProcedure("write:all")
    .meta({
      openapi: { method: "POST", path: "/fields", tags: ["Fields"], summary: "Create a new field" },
    })
    .input(createFieldSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return fieldService.create(ctx.user.id, {
        formId: input.formId,
        type: input.type as any, // Cast since FIELD_TYPES enum matches db enum
        label: input.label,
        helpText: input.helpText,
        placeholder: input.placeholder,
        required: input.required,
        pageNumber: input.pageNumber,
        options: input.options,
        validations: input.validations,
        settings: input.settings,
      });
    }),

  update: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "PATCH",
        path: "/fields/{fieldId}",
        tags: ["Fields"],
        summary: "Update a field",
      },
    })
    .input(updateFieldSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { fieldId, ...data } = input;
      return fieldService.update(ctx.user.id, fieldId, data);
    }),

  delete: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "DELETE",
        path: "/fields/{fieldId}",
        tags: ["Fields"],
        summary: "Delete a field",
      },
    })
    .input(z.object({ fieldId: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await fieldService.delete(ctx.user.id, input.fieldId);
      return { success: true };
    }),

  reorder: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "POST",
        path: "/fields/reorder",
        tags: ["Fields"],
        summary: "Reorder fields",
      },
    })
    .input(reorderFieldsSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await fieldService.reorder(ctx.user.id, input.formId, input.fieldIds);
      return { success: true };
    }),

  listByFormId: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/fields/by-form/{formId}",
        tags: ["Fields"],
        summary: "List fields for a form",
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return fieldService.listByFormId(ctx.user.id, input.formId);
    }),

  bulkSync: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "POST",
        path: "/fields/bulk-sync",
        tags: ["Fields"],
        summary: "Bulk sync fields for a form",
        description: "Accepts the complete desired field list. Creates new fields, updates existing ones, and deletes any that are not in the list. All changes happen in a single transaction.",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
        fields: z.array(
          z.object({
            id: z.string().uuid().optional(),
            type: z.enum(FIELD_TYPES),
            label: z.string().min(1).max(500).trim(),
            placeholder: z.string().max(255).trim().optional(),
            helpText: z.string().max(500).trim().optional(),
            required: z.boolean().default(false),
            pageNumber: z.number().int().min(1).default(1).optional(),
            options: z
              .array(
                z.object({
                  label: z.string().min(1).max(255),
                  value: z.string().min(1).max(255),
                  imageUrl: z.string().url().optional().nullable(),
                }),
              )
              .optional(),
            validations: z
              .object({
                minLength: z.number().int().min(0).optional(),
                maxLength: z.number().int().min(0).optional(),
                min: z.number().optional(),
                max: z.number().optional(),
                pattern: z.string().optional(),
                patternMessage: z.string().optional(),
              })
              .optional(),
            settings: z
              .object({
                ratingMax: z.number().int().min(1).max(10).optional(),
                placeholder: z.string().max(255).optional(),
              })
              .optional(),
          }),
        ),
      }),
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return fieldService.bulkSync(ctx.user.id, input.formId, input.fields as any);
    }),
});
