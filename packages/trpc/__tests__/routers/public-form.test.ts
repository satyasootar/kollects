import { describe, it, expect, vi } from "vitest";
import { serverRouter } from "../../server";

vi.mock("../../server/services", () => {
  return {
    formService: {
      getPublicBySlug: vi.fn(),
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

describe("Public Form Router", () => {
  it("should fetch a public form by slug and return correct fields", async () => {
    const { formService } = await import("../../server/services");
    formService.getPublicBySlug = vi.fn().mockResolvedValue({
      id: "form-123",
      slug: "my-form",
      title: "Public Form",
      description: "Test description",
      passwordHash: null,
      status: "published",
    });

    const caller = createCaller();
    const result = await caller.publicForm.getBySlug({ slug: "my-form" });

    expect(formService.getPublicBySlug).toHaveBeenCalledWith("my-form", undefined);
    expect(result).toHaveProperty("id", "form-123");
    expect(result).toHaveProperty("title", "Public Form");
    expect(result).toHaveProperty("passwordProtected", false);
  });
});
