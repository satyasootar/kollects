import { z, zodUndefinedModel } from "../../schema";
import { authService, userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { setSessionCookie, clearSessionCookie } from "../../utils/cookies";
import { createRateLimitMiddleware } from "../../middleware/rate-limit";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@repo/database/schemas/auth";
import { TRPCError } from "@trpc/server";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

// Rate limits
const loginRateLimit = createRateLimitMiddleware("login", 10, 15 * 60 * 1000);
const registerRateLimit = createRateLimitMiddleware("register", 5, 15 * 60 * 1000);
const forgotPasswordRateLimit = createRateLimitMiddleware("forgot-password", 3, 60 * 60 * 1000);
const resetPasswordRateLimit = createRateLimitMiddleware("reset-password", 5, 15 * 60 * 1000);

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  register: publicProcedure
    .use(registerRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS } })
    .input(registerSchema)
    .output(z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      }).passthrough(),
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await authService.register(input, {
        ip: ctx.ipHash,
        userAgent: ctx.userAgent,
      });
      setSessionCookie(ctx.res, token);
      return { user, token };
    }),

  login: publicProcedure
    .use(loginRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(loginSchema)
    .output(z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      }).passthrough(),
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await authService.login(input, {
        ip: ctx.ipHash,
        userAgent: ctx.userAgent,
      });
      setSessionCookie(ctx.res, token);
      return { user, token };
    }),

  logout: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/logout"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
      const token = ctx.req?.headers?.cookie?.match(/session=([^;]+)/)?.[1];
      await authService.logout(ctx.session.id, token);
      clearSessionCookie(ctx.res);
      return { success: true };
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      }).passthrough(),
    }))
    .query(async ({ ctx }) => {
      return { user: ctx.user! };
    }),

  forgotPassword: publicProcedure
    .use(forgotPasswordRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/forgot-password"), tags: TAGS } })
    .input(forgotPasswordSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.forgotPassword(input);
      return { success: true };
    }),

  resetPassword: publicProcedure
    .use(resetPasswordRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/reset-password"), tags: TAGS } })
    .input(resetPasswordSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.resetPassword(input);
      return { success: true };
    }),
});
