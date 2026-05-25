import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { formService, analyticsService } from "../../services";
import { TRPCError } from "@trpc/server";

export const publicFormRouter = router({
  getBySlug: publicProcedure
    .meta({ openapi: { method: "GET", path: "/public/forms/{slug}", tags: ["Public Forms"], summary: "Get form by slug for public viewing" } })
    .input(z.object({
      slug: z.string(),
      passwordToken: z.string().optional(),
      sessionId: z.string().optional(),
      referrer: z.string().url().optional().nullable(),
    }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      // getPublicBySlug handles visibility, status, and password checks
      // and throws standard TRPCErrors (404/403) if access is denied.
      const form = await formService.getPublicBySlug(
        input.slug, 
        input.passwordToken ? async (formId) => {
          const { verifyFormPasswordToken } = await import("@repo/services/auth/form-token");
          return verifyFormPasswordToken(input.passwordToken!, formId);
        } : undefined
      );

      // Fire and forget view tracking
      analyticsService.recordView(form.id, ctx.ipHash, input.sessionId, input.referrer ?? undefined).catch(console.error);

      // Return only the necessary public fields to the frontend
      return {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        coverImageUrl: form.coverImageUrl,
        themeId: form.themeId,
        settings: form.settings,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        passwordProtected: !!form.passwordHash,
      };
    }),

  validatePassword: publicProcedure
    .meta({ openapi: { method: "POST", path: "/public/forms/{slug}/validate-password", tags: ["Public Forms"], summary: "Validate password for a protected form" } })
    .input(z.object({
      slug: z.string(),
      password: z.string(),
    }))
    .output(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      return formService.validatePassword(input.slug, input.password);
    }),
});
