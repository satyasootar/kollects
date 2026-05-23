import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../../schemas/auth";

describe("Auth Schemas", () => {
  it("should validate a proper login payload", () => {
    const validPayload = {
      email: "test@example.com",
      password: "Password123!",
    };
    expect(loginSchema.safeParse(validPayload).success).toBe(true);
  });

  it("should reject an invalid email in login payload", () => {
    const invalidPayload = {
      email: "test-invalid-email",
      password: "Password123!",
    };
    expect(loginSchema.safeParse(invalidPayload).success).toBe(false);
  });

  it("should validate a proper registration payload", () => {
    const validPayload = {
      name: "John Doe",
      email: "john@example.com",
      password: "StrongPassword123!",
    };
    expect(registerSchema.safeParse(validPayload).success).toBe(true);
  });

  it("should reject a weak password in registration payload", () => {
    const invalidPayload = {
      name: "John Doe",
      email: "john@example.com",
      password: "weak", // Fails regex tests for strength
    };
    expect(registerSchema.safeParse(invalidPayload).success).toBe(false);
  });
});
