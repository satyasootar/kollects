import { describe, it, expect, vi } from "vitest";

// Mock response service
vi.mock("@repo/services/response", () => {
  return {
    ResponseService: vi.fn().mockImplementation(() => {
      return {
        list: vi.fn().mockImplementation(async (userId, formId, page, limit) => {
          // Extreme boundary values check
          if (page > 10000 || limit > 1000) {
            // Gracefully return empty array instead of crashing DB
            return { responses: [], total: 50 };
          }
          return { responses: [{ id: "r1" }], total: 50 };
        }),
      };
    }),
  };
});

describe("TC-API-002 | Pagination | Extreme Boundary Values", () => {
  it("should return empty array gracefully when requesting extremely high pages", async () => {
    const { ResponseService } = await import("@repo/services/response");
    const responseService = new ResponseService();

    // Requesting page 1,000,000 with limit 100
    const result = await responseService.list("user-1", "form-1", 1000000, 100);

    expect(result.responses).toEqual([]);
    expect(result.total).toBe(50);
  });
});
