import { describe, it, expect, vi } from "vitest";
import { serverRouter } from "../../server";

vi.mock("../../server/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../server/services")>();
  return {
    ...actual,
    authService: {
      resolveUser: vi.fn().mockResolvedValue({ user: { id: "user-1", email: "test@test.com" } }),
    },
    responseService: {
      list: vi.fn(),
      getById: vi.fn(),
      delete: vi.fn(),
      exportCsv: vi.fn(),
    },
  };
});

const createCaller = () => {
  return serverRouter.createCaller({
    db: {} as any,
    user: { id: "user-1", email: "test@test.com" } as any,
    session: {} as any,
    apiKeyScopes: null,
    ipHash: "mocked-ip-hash",
    userAgent: "mocked-user-agent",
    requestMeta: { requestId: "req-id", startTime: Date.now() },
    res: {} as any,
    req: { headers: {} } as any,
  });
};

describe("Response Router", () => {
  it("should list responses", async () => {
    const { responseService } = await import("../../server/services");
    responseService.list = vi.fn().mockResolvedValue({ responses: [], total: 0 });

    const caller = createCaller();
    const result = await caller.response.list({
      formId: "123e4567-e89b-12d3-a456-426614174000",
      page: 1,
      limit: 10,
    });

    expect(result.responses).toEqual([]);
    expect(responseService.list).toHaveBeenCalledWith(
      "user-1",
      "123e4567-e89b-12d3-a456-426614174000",
      1,
      10,
    );
  });

  it("should get response by id", async () => {
    const { responseService } = await import("../../server/services");
    responseService.getById = vi.fn().mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174000",
      formId: "123e4567-e89b-12d3-a456-426614174001",
      submittedAt: new Date(),
      isComplete: true,
      completionTimeSeconds: 10,
      ipHash: "hash",
      userAgent: "agent",
      answers: [],
    });

    const caller = createCaller();
    const result = await caller.response.getById({
      responseId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.id).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("should delete response", async () => {
    const { responseService } = await import("../../server/services");
    responseService.delete = vi.fn().mockResolvedValue(undefined);

    const caller = createCaller();
    const result = await caller.response.delete({
      responseId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(true);
  });

  it("should export CSV", async () => {
    const { responseService } = await import("../../server/services");
    responseService.exportCsv = vi.fn().mockResolvedValue("id,col1\n1,val1");

    const caller = createCaller();
    const result = await caller.response.exportCsv({
      formId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result).toBe("id,col1\n1,val1");
  });
});
