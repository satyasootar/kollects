import { z } from "zod";
import { protectedProcedure, scopedProcedure, router } from "../../trpc";
import { fieldService } from "../../services";
import { 
  createFieldSchema, 
  updateFieldSchema, 
  reorderFieldsSchema 
} from "@repo/database/schemas/field";

export const fieldRouter = router({
  create: scopedProcedure("write:all")
    .meta({ openapi: { method: "POST", path: "/fields", tags: ["Fields"], summary: "Create a new field" } })
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
    .meta({ openapi: { method: "PATCH", path: "/fields/{fieldId}", tags: ["Fields"], summary: "Update a field" } })
    .input(updateFieldSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { fieldId, ...data } = input;
      return fieldService.update(ctx.user.id, fieldId, data);
    }),

  delete: scopedProcedure("write:all")
    .meta({ openapi: { method: "DELETE", path: "/fields/{fieldId}", tags: ["Fields"], summary: "Delete a field" } })
    .input(z.object({ fieldId: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await fieldService.delete(ctx.user.id, input.fieldId);
      return { success: true };
    }),

  reorder: scopedProcedure("write:all")
    .meta({ openapi: { method: "POST", path: "/fields/reorder", tags: ["Fields"], summary: "Reorder fields" } })
    .input(reorderFieldsSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await fieldService.reorder(ctx.user.id, input.formId, input.fieldIds);
      return { success: true };
    }),
});
