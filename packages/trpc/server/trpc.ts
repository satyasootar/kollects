import { t, router, middleware } from "./init";
import { timingMiddleware } from "./middleware/timing";
import { loggingMiddleware } from "./middleware/logging";
import { authMiddleware } from "./middleware/auth";
import { TRPCError } from "@trpc/server";

export { t, router, middleware };

/**
 * Public procedure — applies timing + logging. No auth required.
 */
export const publicProcedure = t.procedure.use(timingMiddleware).use(loggingMiddleware);

/**
 * Protected procedure — applies timing + logging + auth.
 * Guarantees `ctx.user` and either `ctx.session` or `ctx.apiKeyScopes` is non-null.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(loggingMiddleware)
  .use(authMiddleware);

/**
 * Scoped procedure — applies timing + logging + auth + specific API scope check.
 * Used to ensure an API key has the necessary scope to perform an action.
 */
export const scopedProcedure = (requiredScope: string) =>
  protectedProcedure.use(
    middleware(async ({ ctx, next }) => {
      // If authenticated via API Key, verify scopes.
      if (ctx.apiKeyScopes && !ctx.apiKeyScopes.includes(requiredScope)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `API Key lacks required scope: ${requiredScope}`,
        });
      }
      // If authenticated via session or has correct scope, allow.
      return next();
    }),
  );

/**
 * Admin procedure — same as protected, but additionally checks for enterprise plan.
 */
export const adminProcedure = protectedProcedure.use(
  middleware(async ({ ctx, next }) => {
    if (ctx.user!.plan !== "enterprise" && (ctx.user as any).role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin or enterprise privileges required.",
      });
    }
    return next();
  }),
);
