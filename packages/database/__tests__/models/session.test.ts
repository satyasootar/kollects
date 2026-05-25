import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../index";
import { usersTable } from "../../models/user";
import { sessionsTable } from "../../models/session";
import { eq } from "drizzle-orm";

describe("Session Model Tests", () => {
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Create a dummy user for session tests
    const user = await db
      .insert(usersTable)
      .values({
        name: "Session Test User",
        email: "session-test@example.com",
      })
      .returning();
    testUserId = user[0]!.id;
  });

  afterAll(async () => {
    // Clean up dummy user (will cascade delete session)
    await db.delete(usersTable).where(eq(usersTable.id, testUserId));
  });

  it("should insert a new session for a valid user", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newSession = {
      userId: testUserId,
      token: "dummy-session-token",
      expiresAt: tomorrow,
    };

    const inserted = await db.insert(sessionsTable).values(newSession).returning();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.userId).toBe(testUserId);
    expect(inserted[0]!.token).toBe(newSession.token);

    testSessionId = inserted[0]!.id;
  });

  it("should fail to insert a session with invalid user ID", async () => {
    const invalidSession = {
      userId: "00000000-0000-0000-0000-000000000000",
      token: "invalid-token",
      expiresAt: new Date(),
    };

    await expect(db.insert(sessionsTable).values(invalidSession)).rejects.toThrow();
  });
});
