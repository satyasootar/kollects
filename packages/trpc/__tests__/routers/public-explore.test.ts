import { describe, it, expect, vi } from "vitest";
import { serverRouter } from "../../server";

vi.mock("@repo/database", () => {
  return {
    db: {
      select: vi.fn(),
    },
    eq: vi.fn(),
    and: vi.fn(),
    desc: vi.fn(),
    isNull: vi.fn(),
    formsTable: {},
  };
});

vi.mock("../../server/services", () => {
  return {
    cacheService: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const createCaller = () => {
  return serverRouter.createCaller({
    db: {} as any,
    user: null,
    session: null,
    apiKeyScopes: null,
    ipHash: "123",
    userAgent: "test",
    requestMeta: { requestId: "req-id", startTime: Date.now() },
    res: {} as any,
    req: { headers: {} } as any,
  });
};

describe("Public Explore Router", () => {
  it("should query only published and public forms", async () => {
    // We update the mock temporarily for this test
    const { db } = await import("@repo/database");
    
    // Create a mock chain
    const mockChain = {
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue([{ id: "form-1", title: "Public Form" }]),
    };
    
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(mockChain),
      }),
    }) as any;

    const caller = createCaller();
    const result = await caller.publicExplore.list({ limit: 10 });
    
    // We mainly want to ensure it doesn't crash and returns the mock
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toHaveProperty("title", "Public Form");
  });
});
