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
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS, summary: "Get supported auth providers", description: "Returns a list of authentication methods supported by this instance (e.g., email/password, Google OAuth). Use this to dynamically render login/register UI options." } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  register: publicProcedure
    .use(registerRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/register"), tags: TAGS, summary: "Register a new user", description: "Creates a new user account with email and password. Automatically creates a session and sets a secure HttpOnly cookie. Returns the user object and session token. Rate limited to 5 requests per 15 minutes per IP." } })
    .input(registerSchema)
    .output(
      z.object({
        user: z
          .object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
          })
          .passthrough(),
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await authService.register(input, {
        ip: ctx.ipHash,
        userAgent: ctx.userAgent,
      });
      setSessionCookie(ctx.res, token);
      return { user, token };
    }),

  googleLogin: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/google"), tags: TAGS, summary: "Sign in with Google", description: "Verifies a Google ID token credential from the frontend, upserts the user account (creates if new, updates avatar if returning), creates a session, and sets the session cookie. Works for both sign-up and sign-in flows." } })
    .input(z.object({ credential: z.string().min(1, "Google credential is required") }))
    .output(
      z.object({
        user: z
          .object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
          })
          .passthrough(),
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await authService.googleLogin(input.credential, {
        ip: ctx.ipHash,
        userAgent: ctx.userAgent,
      });
      setSessionCookie(ctx.res, token);
      return { user, token };
    }),

  login: publicProcedure
    .use(loginRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS, summary: "Log in", description: "Authenticates a user with email and password. Sets a secure session cookie (30-day expiry) and returns the user object with session token. Rate limited to 10 requests per 15 minutes per IP. Failed attempts are logged for security auditing." } })
    .input(loginSchema)
    .output(
      z.object({
        user: z
          .object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
          })
          .passthrough(),
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await authService.login(input, {
        ip: ctx.ipHash,
        userAgent: ctx.userAgent,
      });
      setSessionCookie(ctx.res, token);
      return { user, token };
    }),

  logout: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/logout"), tags: TAGS, summary: "Log out", description: "Invalidates the current session and clears the session cookie. Requires authentication. The session token is immediately revoked and cannot be reused." } })
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
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS, summary: "Get current user", description: "Returns the authenticated user's profile information. Requires a valid session cookie or API key. Never returns the password hash or other sensitive internal fields." } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        user: z
          .object({
            id: z.string(),
            name: z.string(),
            email: z.string().email(),
          })
          .passthrough(),
      }),
    )
    .query(async ({ ctx }) => {
      return { user: ctx.user! };
    }),

  forgotPassword: publicProcedure
    .use(forgotPasswordRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/forgot-password"), tags: TAGS, summary: "Request password reset", description: "Sends a password reset email to the specified address if an account exists. Always returns success (even if email not found) to prevent email enumeration attacks. The reset token expires in 1 hour. Rate limited to 3 requests per hour per IP." } })
    .input(forgotPasswordSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.forgotPassword(input);
      return { success: true };
    }),

  resetPassword: publicProcedure
    .use(resetPasswordRateLimit)
    .meta({ openapi: { method: "POST", path: getPath("/reset-password"), tags: TAGS, summary: "Reset password with token", description: "Resets the user's password using a valid reset token (received via email). The token is single-use and expires after 1 hour. After successful reset, all existing sessions for the user are invalidated, forcing re-login on all devices." } })
    .input(resetPasswordSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await authService.resetPassword(input);
      return { success: true };
    }),
});
