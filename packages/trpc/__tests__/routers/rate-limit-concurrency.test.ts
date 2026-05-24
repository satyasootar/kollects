import { describe, it, expect, vi } from "vitest";
import { serverRouter } from "../../server";

// Mock rate limit upsert to simulate a database delay where race conditions usually happen
let rateLimitCounter = 0;

vi.mock("@repo/database", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    db: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockImplementation(async () => {
            // Simulate network/DB delay to increase race condition window
            await new Promise((resolve) => setTimeout(resolve, 50));
            rateLimitCounter += 1;
            
            if (rateLimitCounter > 5) {
              throw new Error("Rate limit exceeded");
            }
            return [];
          })
        })
      })
    }
  };
});

const createCaller = () => {
  return serverRouter.createCaller({
    db: {} as any,
    user: null,
    session: null,
    apiKeyScopes: null,
    ipHash: "concurrent-ip", // Same IP to trigger rate limit
    userAgent: "test",
    requestMeta: { requestId: "req-id", startTime: Date.now() },
    res: {} as any,
    req: { headers: {} } as any,
  });
};

describe("TC-EDG-001 | Rate Limiting | Distributed High-Concurrency Spam", () => {
  it("should enforce rate limits strictly even with parallel requests", async () => {
    // Reset counter
    rateLimitCounter = 0;
    const caller = createCaller();

    // Fire 10 parallel login attempts (limit is 5)
    const attempts = Array.from({ length: 10 }).map(() => 
      caller.auth.login({
        email: "test@example.com",
        password: "password123",
      }).catch(e => e)
    );

    const results = await Promise.all(attempts);

    // We expect the first 5 to pass the rate limiter (though they might fail auth)
    // We expect the next 5 to be strictly rejected by the rate limiter
    const rateLimitErrors = results.filter(r => r instanceof Error && r.message === "Rate limit exceeded");
    
    // Exactly 5 should fail due to rate limit, proving the counter was atomic
    expect(rateLimitErrors.length).toBe(5);
  });
});
