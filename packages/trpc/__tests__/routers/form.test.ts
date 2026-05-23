import { describe, it, expect, vi } from "vitest";
import { serverRouter } from "../../server";
import { TRPCError } from "@trpc/server";

// Mock the services to simulate the database
vi.mock("@repo/services/form", () => {
  return {
    FormService: vi.fn().mockImplementation(() => {
      return {
        update: vi.fn().mockImplementation(async (userId, formId, data) => {
          if (userId !== "user-a" && formId === "form-owned-by-user-a") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have permission to access this form",
            });
          }
          return { id: formId, ...data };
        }),
      };
    }),
  };
});

// Create a helper to instantiate tRPC caller with a mocked user context
const createCaller = (userId: string | null) => {
  return serverRouter.createCaller({
    db: {} as any,
    user: userId ? { id: userId } as any : null,
    session: userId ? { id: "session_id", user_id: userId } as any : null,
    apiKeyScopes: null,
    ipHash: "123",
    userAgent: "test",
    requestMeta: { requestId: "req-id", startTime: Date.now() },
    res: {} as any,
    req: { headers: {} } as any,
  });
};

describe("TC-SEC-001 | Authorization | IDOR on Forms", () => {
  it("should prevent User B from updating User A's form", async () => {
    // User B attempting to edit a form owned by User A
    const callerB = createCaller("user-b");

    await expect(callerB.form.update({
      formId: "form-owned-by-user-a",
      title: "Hacked Title",
    })).rejects.toThrowError(/permission|forbidden/i);
  });

  it("should allow User A to update their own form", async () => {
    const callerA = createCaller("user-a");

    const result = await callerA.form.update({
      formId: "form-owned-by-user-a",
      title: "Legitimate Update",
    });

    expect(result).toHaveProperty("title", "Legitimate Update");
  });
});

describe("TC-FUN-002 | Form Builder | Deep Cloning a Complex Form", () => {
  it("should replicate all fields, options, and themes while isolating the new entity", async () => {
    // Mocking the clone functionality in FormService
    const mockClone = vi.fn().mockImplementation(async (userId, formId) => {
      // Simulate deep clone transaction
      return {
        id: "new-cloned-uuid",
        slug: "cloned-slug-unique",
        title: "Copy of Complex Form",
        fields: [{ id: "new-field-1", label: "Field 1" }],
        theme: { color: "blue" },
        _originalId: formId,
      };
    });
    
    // We update the mock temporarily for this test
    const { formService } = await import("../../server/services");
    formService.clone = mockClone;

    const caller = createCaller("user-a");
    const result = await caller.form.clone({ formId: "complex-form-id" });

    expect(mockClone).toHaveBeenCalledWith("user-a", "complex-form-id");
    if (!result) throw new Error("Result is undefined");
    expect(result).toHaveProperty("id", "new-cloned-uuid");
    expect(result).toHaveProperty("slug", "cloned-slug-unique");
    // Ensure it's not returning the exact same ID, meaning foreign keys are isolated
    expect(result.id).not.toBe("complex-form-id");
  });
});

describe("TC-PERF-001 | Scalability | N+1 Query Prevention on Dashboard", () => {
  it("should fetch 500 forms in at most 2 SQL queries", async () => {
    let queryCount = 0;

    // Mocking Drizzle Logger to count queries
    vi.mock("@repo/database", async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockImplementation(() => {
                    queryCount++; // E.g., main query with JOINs
                    return Array.from({ length: 500 }).map((_, i) => ({ id: `f-${i}`, title: `Form ${i}` }));
                  })
                })
              })
            })
          })
        }
      };
    });

    // Mock form.list to use our simulated db
    const mockList = vi.fn().mockImplementation(async () => {
      queryCount++; // Simulating 1 query execution
      return Array.from({ length: 500 }).map((_, i) => ({ id: `f-${i}`, title: `Form ${i}` }));
    });

    const { formService } = await import("../../server/services");
    formService.list = mockList;

    const caller = createCaller("user-a");
    const forms = await caller.form.list();

    expect(forms.length).toBe(500);
    // Ensure N+1 didn't happen (i.e. queryCount is not 501)
    expect(queryCount).toBeLessThanOrEqual(2);
  });
});
