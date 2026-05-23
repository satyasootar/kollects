import { TRPCError } from "@trpc/server";
import { middleware } from "../init";
import { db, eq, and, sql } from "@repo/database";
import { rateLimitEntriesTable } from "@repo/database/models/system";

/**
 * Factory — creates a parameterized rate-limit middleware.
 * @param action  Unique string identifying the action (e.g., "login", "register")
 * @param limit   Max number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function createRateLimitMiddleware(
  action: string,
  limit: number,
  windowMs: number
) {
  return middleware(async ({ ctx, next }) => {
    const identifier = ctx.ipHash;
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

    // Upsert rate limit entry
    await db
      .insert(rateLimitEntriesTable)
      .values({ identifier, action, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [
          rateLimitEntriesTable.identifier,
          rateLimitEntriesTable.action,
          rateLimitEntriesTable.windowStart,
        ],
        set: { count: sql`${rateLimitEntriesTable.count} + 1` },
      });

    // Read current count
    const [entry] = await db
      .select({ count: rateLimitEntriesTable.count })
      .from(rateLimitEntriesTable)
      .where(
        and(
          eq(rateLimitEntriesTable.identifier, identifier),
          eq(rateLimitEntriesTable.action, action),
          eq(rateLimitEntriesTable.windowStart, windowStart)
        )
      )
      .limit(1);

    if (entry && entry.count > limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many requests. Please try again later.`,
      });
    }

    return next();
  });
}
