import { middleware } from "../init";
import { rateLimitService } from "../services";

/**
 * Factory — creates a parameterized rate-limit middleware.
 * @param action  Unique string identifying the action (e.g., "login", "register")
 * @param limit   Max number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function createRateLimitMiddleware(action: string, limit: number, windowMs: number) {
  return middleware(async ({ ctx, next }) => {
    const identifier = ctx.ipHash;

    // Defer to the centralized RateLimitService
    await rateLimitService.check(identifier, action, limit, windowMs);

    return next();
  });
}
