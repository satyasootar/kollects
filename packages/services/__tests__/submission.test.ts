import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubmissionService } from "../submission";
import { TRPCError } from "@trpc/server";

// Mock the dependencies
vi.mock("@repo/database", () => {
  return {
    db: {
      select: vi.fn(),
      transaction: vi.fn(),
    },
    eq: vi.fn(),
    and: vi.fn(),
    sql: vi.fn(),
  };
});

vi.mock("@repo/database/models/form", () => ({ formsTable: {} }));
vi.mock("@repo/database/models/form-field", () => ({ formFieldsTable: {} }));
vi.mock("@repo/database/models/form-response", () => ({ formResponsesTable: {} }));
vi.mock("@repo/database/models/response-answer", () => ({ responseAnswersTable: {} }));
vi.mock("../submission/dynamic-validator", () => {
  return {
    buildValidationSchema: vi.fn().mockReturnValue({
      safeParse: vi.fn().mockReturnValue({ success: true, data: { field1: "value" } }),
    }),
  };
});

describe("SubmissionService", () => {
  let submissionService: SubmissionService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    submissionService = new SubmissionService();
  });

  it("should throw NOT_FOUND if form does not exist", async () => {
    const { db } = await import("@repo/database");
    
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // Return empty array
        }),
      }),
    }) as any;

    await expect(submissionService.submit("non-existent-slug", {}))
      .rejects.toThrowError(new TRPCError({ code: "NOT_FOUND", message: "Form not found" }));
  });

  it("should throw FORBIDDEN if form is not published", async () => {
    const { db } = await import("@repo/database");
    
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "form1", status: "draft", deletedAt: null }]),
        }),
      }),
    }) as any;

    await expect(submissionService.submit("draft-form", {}))
      .rejects.toThrowError(new TRPCError({ code: "FORBIDDEN", message: "Form is not accepting responses" }));
  });

  it("should successfully process a submission within a transaction", async () => {
    const { db } = await import("@repo/database");
    
    // Mock the db.select to first return the form, then return the fields
    db.select = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "form1", status: "published", deletedAt: null }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "field1", type: "short_text" }]),
        }),
      }) as any;

    // Mock transaction
    db.transaction = vi.fn().mockResolvedValue("mocked-response-uuid");

    const result = await submissionService.submit("valid-form", { field1: "value" });
    
    expect(result.responseId).toBe("mocked-response-uuid");
    expect(db.transaction).toHaveBeenCalled();
  });
});
