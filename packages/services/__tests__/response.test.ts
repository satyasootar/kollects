import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResponseService } from "../response";
import { TRPCError } from "@trpc/server";
import { generateCsvExport } from "../response/csv-export";

// Mock database
vi.mock("@repo/database", () => {
  return {
    db: {
      query: {
        formsTable: { findFirst: vi.fn() },
        formResponsesTable: { findMany: vi.fn(), findFirst: vi.fn() },
        formFieldsTable: { findMany: vi.fn() },
      },
      select: vi.fn(),
      transaction: vi.fn(),
    },
    eq: vi.fn(),
    and: vi.fn(),
    desc: vi.fn(),
    sql: vi.fn(),
  };
});

vi.mock("@repo/database/models/form", () => ({ formsTable: {} }));
vi.mock("@repo/database/models/form-response", () => ({ formResponsesTable: {} }));
vi.mock("@repo/database/models/response-answer", () => ({ responseAnswersTable: {} }));
vi.mock("@repo/database/models/form-field", () => ({ formFieldsTable: {} }));

// Keep actual generateCsvExport to test papaparse
vi.mock("../response/csv-export", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../response/csv-export")>();
  return {
    ...actual,
    generateCsvExport: actual.generateCsvExport, // use real function
  };
});

describe("ResponseService", () => {
  let responseService: ResponseService;

  beforeEach(() => {
    vi.clearAllMocks();
    responseService = new ResponseService();
  });

  describe("enforceFormOwnership", () => {
    it("should throw FORBIDDEN if user doesn't own form", async () => {
      const { db } = await import("@repo/database");
      (db as any).query.formsTable.findFirst = vi.fn().mockResolvedValue(null);

      await expect(responseService.list("user1", "form1", 1, 10)).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this form",
        }),
      );
    });
  });

  describe("list", () => {
    it("should return paginated responses", async () => {
      const { db } = await import("@repo/database");
      (db as any).query.formsTable.findFirst = vi
        .fn()
        .mockResolvedValue({ id: "form1", creatorId: "user1" });

      const mockResponses = [{ id: "res1" }, { id: "res2" }];
      (db as any).query.formResponsesTable.findMany = vi.fn().mockResolvedValue(mockResponses);

      db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        }),
      }) as any;

      const result = await responseService.list("user1", "form1", 1, 10);
      expect(result.responses).toEqual(mockResponses);
      expect(result.total).toBe(2);
    });
  });

  describe("delete", () => {
    it("should delete response and answers", async () => {
      const { db } = await import("@repo/database");
      (db as any).query.formsTable.findFirst = vi
        .fn()
        .mockResolvedValue({ id: "form1", creatorId: "user1" });
      (db as any).query.formResponsesTable.findFirst = vi
        .fn()
        .mockResolvedValue({ id: "res1", formId: "form1", isComplete: true });
      db.transaction = vi.fn().mockImplementation(async (cb) => {
        const tx = {
          delete: vi.fn().mockReturnValue({ where: vi.fn() }),
          update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
          query: {
            formsTable: {
              findFirst: vi.fn().mockResolvedValue({ id: "form1", totalSubmissions: 5 }),
            },
          },
        };
        await cb(tx);
        expect(tx.delete).toHaveBeenCalledTimes(2); // answers, response
        expect(tx.update).toHaveBeenCalledTimes(1); // form totalSubmissions
      });

      await responseService.delete("user1", "res1");
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe("exportCsv", () => {
    it("should export responses to CSV formatted string", async () => {
      const { db } = await import("@repo/database");
      (db as any).query.formsTable.findFirst = vi
        .fn()
        .mockResolvedValue({ id: "form1", creatorId: "user1" });

      (db as any).query.formFieldsTable.findMany = vi.fn().mockResolvedValue([
        { id: "field1", type: "short_text", label: "Name" },
        { id: "field2", type: "multi_select", label: "Fruits" },
      ]);

      const mockDate = new Date("2026-05-24T00:00:00Z");

      (db as any).query.formResponsesTable.findMany = vi.fn().mockResolvedValue([
        {
          id: "res1",
          formId: "form1",
          isComplete: true,
          submittedAt: mockDate,
          completionTimeSeconds: 120,
          ipHash: "hash1",
          userAgent: "agent1",
          answers: [
            { fieldId: "field1", value: "Alice" },
            { fieldId: "field2", value: ["Apple", "Banana"] },
          ],
        },
      ]);

      const csvString = await responseService.exportCsv("user1", "form1");

      const expectedHeader =
        "Response ID,Submitted At,Completion Time (s),IP Hash,User Agent,Name,Fruits";
      const expectedRow = `res1,2026-05-24T00:00:00.000Z,120,hash1,agent1,Alice,"Apple, Banana"`;

      expect(csvString).toContain(expectedHeader);
      expect(csvString).toContain(expectedRow);
    });
  });
});
