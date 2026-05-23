import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { formService } from "../../services";
import { 
  createFormSchema, 
  updateFormSchema, 
  publishFormSchema 
} from "@repo/database/schemas/form";

export const formRouter = router({
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/forms", tags: ["Forms"], summary: "Create a new form" } })
    .input(createFormSchema)
    .mutation(async ({ ctx, input }) => {
      return formService.create(ctx.user.id, {
        title: input.title,
        description: input.description,
      });
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/forms/{formId}", tags: ["Forms"], summary: "Update a form" } })
    .input(updateFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { formId, ...data } = input;
      return formService.update(ctx.user.id, formId, data);
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/forms/{formId}", tags: ["Forms"], summary: "Delete a form" } })
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await formService.delete(ctx.user.id, input.formId);
      return { success: true };
    }),

  publish: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/forms/{formId}/publish", tags: ["Forms"], summary: "Publish a form" } })
    .input(publishFormSchema)
    .mutation(async ({ ctx, input }) => {
      return formService.publish(ctx.user.id, input.formId);
    }),

  unpublish: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/forms/{formId}/unpublish", tags: ["Forms"], summary: "Unpublish a form" } })
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return formService.unpublish(ctx.user.id, input.formId);
    }),

  archive: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/forms/{formId}/archive", tags: ["Forms"], summary: "Archive a form" } })
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return formService.archive(ctx.user.id, input.formId);
    }),

  clone: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/forms/{formId}/clone", tags: ["Forms"], summary: "Clone a form" } })
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return formService.clone(ctx.user.id, input.formId);
    }),

  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/forms", tags: ["Forms"], summary: "List user forms" } })
    .input(z.void())
    .query(async ({ ctx }) => {
      return formService.list(ctx.user.id);
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{formId}", tags: ["Forms"], summary: "Get form by ID" } })
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return formService.getById(input.formId, ctx.user.id);
    }),
});
