import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../../index";
import { usersTable } from "../../models/user";
import { eq } from "drizzle-orm";

describe("User Model Tests", () => {
  let createdUserId: string;

  beforeAll(async () => {
    // Delete test user if exists
    await db.delete(usersTable).where(eq(usersTable.email, "model-test@example.com"));
  });

  it("should insert a new user", async () => {
    const newUser = {
      name: "Model Test User",
      email: "model-test@example.com",
      passwordHash: "dummyhash123",
      plan: "free" as const,
    };

    const inserted = await db.insert(usersTable).values(newUser).returning();
    
    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.email).toBe(newUser.email);
    expect(inserted[0]!.plan).toBe("free");
    
    createdUserId = inserted[0]!.id;
  });

  it("should enforce unique email constraint", async () => {
    const duplicateUser = {
      name: "Duplicate User",
      email: "model-test@example.com",
      passwordHash: "hash",
    };

    await expect(
      db.insert(usersTable).values(duplicateUser)
    ).rejects.toThrow();
  });
});
