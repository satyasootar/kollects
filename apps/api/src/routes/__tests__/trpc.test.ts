import request from "supertest";
import app from "../../server";
import { describe, it, expect } from "vitest";

describe("TC-API-001 | Validation | Corrupted JSON Payloads", () => {
  it("should handle extremely deeply nested JSON gracefully without crashing", async () => {
    // Creating a deeply nested JSON object to simulate a malicious payload
    let maliciousPayload: any = "value";
    for (let i = 0; i < 500; i++) {
      maliciousPayload = { nested: maliciousPayload };
    }

    const response = await request(app)
      .post("/trpc/auth.register")
      .send(maliciousPayload);

    // Express's JSON parser might reject it, or tRPC validation will fail it
    // The important part is that the server doesn't crash
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500); // Should be a client error, not a server error 500
  });

  it("should handle malformed JSON gracefully", async () => {
    const response = await request(app)
      .post("/trpc/auth.register")
      .set("Content-Type", "application/json")
      .send("{ invalid json: [ }");

    expect(response.status).toBe(400);
  });

  it("should reject payload with missing required fields correctly", async () => {
    const response = await request(app)
      .post("/trpc/auth.register")
      .send({
        // missing name, email, password
        someUnknownField: true
      });

    // tRPC returns 400 for input validation errors
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("Invalid input");
  });
});
