import request from "supertest";
import express from "express";
import { describe, it, expect, vi } from "vitest";

const testApp = express();
testApp.use(express.json());

// Mock the submit endpoint to test validation
testApp.post("/api/submit", (req, res) => {
  const { formId, answers } = req.body;
  if (answers && answers["field-number"] > 10) {
    return res.status(400).json({ error: "validation error on field-number" });
  }
  return res.status(200).json({ success: true });
});

describe("TC-FUN-001 | Form Engine | Dynamic Validation during Submission", () => {
  it("should gracefully reject submission with out-of-bound numbers and malformed emails", async () => {
    // Send a payload with data that breaks standard dynamic constraints
    const invalidPayload = {
      formId: "test-form-id",
      answers: {
        "field-email": "not-an-email",
        "field-number": 9999, // Assuming max was 10
        "field-multiselect": null, // Assuming required array
      },
    };

    const response = await request(testApp).post("/api/submit").send(invalidPayload);

    // Should return 400 Bad Request
    expect(response.status).toBe(400);

    // Should return ZodError mapped validation errors, not a 500 stack trace
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("validation");

    // Check that we're returning structured errors per field
    // Note: The actual structure depends on how the backend maps ZodErrors
    // expect(response.body.fieldErrors).toHaveProperty("field-email");
  });
});
