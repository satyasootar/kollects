import { z } from "zod";
import { protectedProcedure, scopedProcedure, router } from "../../trpc";
import { formService } from "../../services";
import { createFormSchema, updateFormSchema, publishFormSchema } from "@repo/database/schemas/form";

export const formRouter = router({
  create: scopedProcedure("write:all")
    .meta({
      openapi: { method: "POST", path: "/forms", tags: ["Forms"], summary: "Create a new form", description: "Creates a new form in draft state. Automatically generates a unique URL slug from the title. Enforces per-plan form limits. The form must be published before it can accept responses." },
    })
    .input(createFormSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.create(ctx.user.id, {
        title: input.title,
        description: input.description,
      });
    }),

  update: scopedProcedure("write:all")
    .meta({
      openapi: { method: "PATCH", path: "/forms/{formId}", tags: ["Forms"], summary: "Update a form", description: "Updates form metadata (title, description, slug, theme). Custom slugs are validated for format (lowercase, alphanumeric, hyphens) and uniqueness. Invalidates public cache on slug change." },
    })
    .input(updateFormSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { formId, ...data } = input;
      console.log("UPDATE DATA SETTINGS:", data.settings);
      return formService.update(ctx.user.id, formId, data);
    }),

  delete: scopedProcedure("write:all")
    .meta({
      openapi: { method: "DELETE", path: "/forms/{formId}", tags: ["Forms"], summary: "Delete a form (soft)", description: "Soft-deletes a form by setting `deletedAt`. The form becomes inaccessible publicly and via API but data is retained for potential recovery. Creates an audit log entry." },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      await formService.delete(ctx.user.id, input.formId);
      return { success: true };
    }),

  publish: scopedProcedure("write:all")
    .meta({
      openapi: { method: "POST", path: "/forms/{formId}/publish", tags: ["Forms"], summary: "Publish a form", description: "Transitions a form from draft to published state, making it accessible to respondents via its public slug URL. Sets `publishedAt` timestamp on first publish. Invalidates public cache." },
    })
    .input(publishFormSchema)
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.publish(ctx.user.id, input.formId);
    }),

  unpublish: scopedProcedure("write:all")
    .meta({
      openapi: { method: "POST", path: "/forms/{formId}/unpublish", tags: ["Forms"], summary: "Unpublish a form", description: "Reverts a published form back to draft state. The form immediately stops accepting new responses. Existing responses are preserved. Invalidates public cache." },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.unpublish(ctx.user.id, input.formId);
    }),

  archive: scopedProcedure("write:all")
    .meta({
      openapi: { method: "POST", path: "/forms/{formId}/archive", tags: ["Forms"], summary: "Archive a form", description: "Moves a form to archived state. Archived forms are closed for submissions but remain visible in the creator's dashboard for historical reference. Invalidates public cache." },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.archive(ctx.user.id, input.formId);
    }),

  clone: scopedProcedure("write:all")
    .meta({
      openapi: { method: "POST", path: "/forms/{formId}/clone", tags: ["Forms"], summary: "Clone a form", description: "Creates a deep copy of a form including all fields, options, and settings. The clone is created in draft state with a new slug (appends ' Copy'). Does not copy responses or analytics data." },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.clone(ctx.user.id, input.formId);
    }),

  list: protectedProcedure
    .meta({
      openapi: { method: "GET", path: "/forms", tags: ["Forms"], summary: "List user's forms", description: "Returns all non-deleted forms owned by the authenticated user, ordered by creation date (newest first). Includes all form metadata, counters (views, starts, submissions), and status." },
    })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      return formService.list(ctx.user.id);
    }),

  getById: protectedProcedure
    .meta({
      openapi: { method: "GET", path: "/forms/{formId}", tags: ["Forms"], summary: "Get form by ID", description: "Returns full form details including all settings, counters, and metadata. Verifies ownership — returns 403 if the form belongs to another user. Returns 404 if the form is soft-deleted." },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return formService.getById(input.formId, ctx.user.id);
    }),

  getByIdWithFields: protectedProcedure
    .meta({
      openapi: { method: "GET", path: "/forms/{formId}/full", tags: ["Forms"], summary: "Get form with fields and theme", description: "Returns full form details with all fields (sorted by order) and theme configuration. Used by the form editor, theme designer, and preview pages." },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return formService.getByIdWithFields(input.formId, ctx.user.id);
    }),
});
