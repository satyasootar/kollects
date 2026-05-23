import { t, router, middleware } from "./init";
import { timingMiddleware } from "./middleware/timing";
import { loggingMiddleware } from "./middleware/logging";
import { authMiddleware } from "./middleware/auth";

export { t, router, middleware };

/**
 * Public procedure — applies timing + logging. No auth required.
 */
export const publicProcedure = t.procedure
  .use(timingMiddleware)
  .use(loggingMiddleware);

/**
 * Protected procedure — applies timing + logging + auth.
 * Guarantees `ctx.user` and either `ctx.session` or `ctx.apiKeyScopes` is non-null.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(loggingMiddleware)
  .use(authMiddleware);

/**
 * Admin procedure — same as protected, but additionally checks for admin plan.
 * TODO: Add admin check middleware in Phase 13.
 */
export const adminProcedure = protectedProcedure.use(
  middleware(async ({ ctx, next }) => {
    // Future: check ctx.user.plan === "enterprise" or a dedicated admin flag
    return next();
  })
);
