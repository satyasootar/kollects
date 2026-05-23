import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { ZodError } from "zod";
import type { TRPCContext } from "./context";
import { timingMiddleware } from "./middleware/timing";
import { loggingMiddleware } from "./middleware/logging";
import { authMiddleware } from "./middleware/auth";

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<TRPCContext>()
  .create({
    /**
     * Error formatter: enriches errors with flattened ZodError details
     * so the frontend can display field-level validation messages.
     */
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      };
    },
  });

export const router = t.router;
export const middleware = t.middleware;

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
