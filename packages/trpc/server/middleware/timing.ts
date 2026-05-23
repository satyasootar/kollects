import { middleware } from "../init";
import { logger } from "@repo/logger";

/**
 * Timing middleware — records request start time and logs duration after handler completes.
 */
export const timingMiddleware = middleware(async ({ ctx, path, next }) => {
  const start = ctx.requestMeta.startTime;

  const result = await next();

  const durationMs = Date.now() - start;
  logger.info(`[${ctx.requestMeta.requestId}] ${path} completed in ${durationMs}ms`);

  return result;
});
