import { db, eq, and, sql, lt } from "@repo/database";
import { rateLimitEntriesTable } from "@repo/database/models/system";
import { TRPCError } from "@trpc/server";

export class RateLimitService {
  /**
   * Enforces a rate limit using a sliding window strategy.
   * Throws TRPCError if the limit is exceeded.
   * 
   * @param identifier Unique string identifying the requester (e.g., hashed IP)
   * @param action Action being performed (e.g., "login", "register")
   * @param limit Max allowed requests within the window
   * @param windowMs The window length in milliseconds
   */
  async check(identifier: string, action: string, limit: number, windowMs: number): Promise<void> {
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

    // Upsert rate limit entry and return the updated count atomically
    const [entry] = await db
      .insert(rateLimitEntriesTable)
      .values({ identifier, action, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [
          rateLimitEntriesTable.identifier,
          rateLimitEntriesTable.action,
          rateLimitEntriesTable.windowStart,
        ],
        set: { count: sql`${rateLimitEntriesTable.count} + 1` },
      })
      .returning({ count: rateLimitEntriesTable.count });

    if (entry && entry.count > limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded`,
      });
    }
  }

  /**
   * Deletes rate limit entries older than a certain timestamp.
   * Useful for background cleanup jobs.
   */
  async cleanup(olderThan: Date): Promise<number> {
    const deleted = await db
      .delete(rateLimitEntriesTable)
      .where(lt(rateLimitEntriesTable.windowStart, olderThan))
      .returning({ id: rateLimitEntriesTable.id });
      
    return deleted.length;
  }
}
