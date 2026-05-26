import { describe, it, expect, vi } from "vitest";
import { serverRouter } from "../../server";

vi.mock("../../server/services", () => {
  return {
    submissionService: {
      submit: vi.fn(),
    },
    rateLimitService: {
      check: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const createCaller = () => {
  return serverRouter.createCaller({
    db: {} as any,
    user: null,
    session: null,
    apiKeyScopes: null,
    ipHash: "mocked-ip-hash",
    userAgent: "mocked-user-agent",
    requestMeta: { requestId: "req-id", startTime: Date.now() },
    res: {} as any,
    req: { headers: {} } as any,
  });
};

describe("Public Submit Router", () => {
  it("should successfully call submissionService with metadata", async () => {
    const { submissionService } = await import("../../server/services");

    submissionService.submit = vi.fn().mockResolvedValue({
      responseId: "123e4567-e89b-12d3-a456-426614174000",
      successMessage: "Thanks!",
    });

    const caller = createCaller();

    const result = await caller.publicSubmit.submit({
      slug: "test-form",
      answers: { "123e4567-e89b-12d3-a456-426614174001": "data" },
      metadata: { email: "test@test.com" },
    });

    expect(result).toHaveProperty("responseId", "123e4567-e89b-12d3-a456-426614174000");
    expect(submissionService.submit).toHaveBeenCalledWith(
      "test-form",
      { "123e4567-e89b-12d3-a456-426614174001": "data" },
      { email: "test@test.com", ipHash: "mocked-ip-hash", userAgent: "mocked-user-agent" },
    );
  });
});
