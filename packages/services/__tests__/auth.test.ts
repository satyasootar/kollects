import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AuthService } from "../auth";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { eq } from "drizzle-orm";

describe("AuthService", () => {
  const authService = new AuthService();
  let testUserId: string;
  let testSessionId: string;
  let testSessionToken: string;

  const testEmail = "auth-service-test@example.com";
  const testPassword = "SecurePassword123!";

  afterAll(async () => {
    // Cleanup the user (which cascades to sessions)
    await db.delete(usersTable).where(eq(usersTable.email, testEmail));
  });

  it("should register a new user successfully", async () => {
    const result = await authService.register({
      name: "Auth Test User",
      email: testEmail,
      password: testPassword,
    });

    expect(result.user).toHaveProperty("id");
    expect(result.user.email).toBe(testEmail);
    expect(result.user).not.toHaveProperty("passwordHash");
    
    expect(result.token).toBeDefined();
    expect(result.session).toBeDefined();

    testUserId = result.user.id;
  });

  it("should fail to register with duplicate email", async () => {
    await expect(
      authService.register({
        name: "Duplicate User",
        email: testEmail,
        password: "AnotherPassword1!",
      })
    ).rejects.toThrow("Email is already registered");
  });

  it("should fail to register with invalid zod data", async () => {
    await expect(
      authService.register({
        name: "A", // too short
        email: "not-an-email",
        password: "short",
      })
    ).rejects.toThrow();
  });

  it("should log in successfully", async () => {
    const result = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result.user.id).toBe(testUserId);
    expect(result.token).toBeDefined();

    testSessionToken = result.token;
    testSessionId = result.session.id;
  });

  it("should fail to log in with wrong password", async () => {
    await expect(
      authService.login({
        email: testEmail,
        password: "WrongPassword1!",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should resolve user from session token", async () => {
    const result = await authService.resolveUser({ sessionToken: testSessionToken });
    
    expect(result).not.toBeNull();
    expect(result!.user.id).toBe(testUserId);
  });

  it("should log out (invalidate session)", async () => {
    await authService.logout(testSessionId);

    // Try to resolve again, should fail
    const result = await authService.resolveUser({ sessionToken: testSessionToken });
    expect(result).toBeNull();
  });
});
