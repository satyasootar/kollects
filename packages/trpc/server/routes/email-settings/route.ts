import { z } from "zod";
import { protectedProcedure, scopedProcedure, router } from "../../trpc";
import { EmailSettingsService } from "@repo/services/email-settings";
import { updateEmailSettingsSchema } from "@repo/database/schemas/email-settings";

const emailSettingsService = new EmailSettingsService();

export const emailSettingsRouter = router({
  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms/{formId}/email-settings",
        tags: ["Email Settings"],
        summary: "Get email settings",
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return emailSettingsService.getSettings(ctx.user.id, input.formId);
    }),

  update: scopedProcedure("write:all")
    .meta({
      openapi: {
        method: "PUT",
        path: "/forms/{formId}/email-settings",
        tags: ["Email Settings"],
        summary: "Update email settings",
      },
    })
    .input(
      z.object({
        formId: z.string().uuid(),
        data: updateEmailSettingsSchema,
      })
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return emailSettingsService.updateSettings(ctx.user.id, input.formId, input.data);
    }),
});
