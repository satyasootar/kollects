import { describe, it, expect, vi, beforeEach } from "vitest";
import { authRouter } from "../../server/routes/auth/route";
import { authService, userService } from "../../server/services";
import { TRPCError } from "@trpc/server";
import { type TRPCContext } from "../../server/context";

// Mock the services
vi.mock("../../server/services", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    resolveUser: vi.fn(),
  },
  userService: {
    getAuthenticationMethods: vi.fn(),
  },
}));

// Mock cookies utility
vi.mock("../../server/utils/cookies", () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

import { setSessionCookie, clearSessionCookie } from "../../server/utils/cookies";

describe("Auth Router", () => {
  const getMockCtx = () => ({
    ipHash: `123.123.123.123-hash-${Math.random()}`,
    userAgent: "vitest",
    res: {} as any,
    req: {} as any,
    db: {} as any,
    user: null,
    session: null,
    apiKeyScopes: null,
    requestMeta: { startTime: Date.now(), requestId: "test-req" },
  } as unknown as TRPCContext);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register should call authService and set cookie", async () => {
    const ctx = getMockCtx();
    const caller = authRouter.createCaller(ctx);
    const mockUser = { id: "u1", name: "Test", email: "test@example.com" };
    
    vi.mocked(authService.register).mockResolvedValueOnce({
      user: mockUser as any,
      session: { id: "s1" } as any,
      token: "secret-token",
    });

    const result = await caller.register({
      name: "Test",
      email: "test@example.com",
      password: "Password1!",
    });

    expect(authService.register).toHaveBeenCalledWith(
      { name: "Test", email: "test@example.com", password: "Password1!" },
      { ip: ctx.ipHash, userAgent: ctx.userAgent }
    );
    expect(setSessionCookie).toHaveBeenCalledWith(ctx.res, "secret-token");
    expect(result.token).toBe("secret-token");
    expect(result.user.id).toBe("u1");
  });

  it("login should call authService and set cookie", async () => {
    const ctx = getMockCtx();
    const caller = authRouter.createCaller(ctx);
    const mockUser = { id: "u2", name: "Bob", email: "bob@example.com" };
    
    vi.mocked(authService.login).mockResolvedValueOnce({
      user: mockUser as any,
      session: { id: "s2" } as any,
      token: "login-token",
    });

    const result = await caller.login({
      email: "bob@example.com",
      password: "Password1!",
    });

    expect(authService.login).toHaveBeenCalledWith(
      { email: "bob@example.com", password: "Password1!" },
      { ip: ctx.ipHash, userAgent: ctx.userAgent }
    );
    expect(setSessionCookie).toHaveBeenCalledWith(ctx.res, "login-token");
    expect(result.token).toBe("login-token");
  });

  it("logout should clear cookie and call authService if session exists", async () => {
    const ctx = getMockCtx();
    const authenticatedCtx = {
      ...ctx,
      session: { id: "sess1" },
    } as unknown as TRPCContext;

    vi.mocked(authService.resolveUser).mockResolvedValueOnce({
      user: { id: "u1", name: "User", email: "u@u.com" } as any,
      session: authenticatedCtx.session as any,
    });

    const caller = authRouter.createCaller(authenticatedCtx);

    const result = await caller.logout(undefined);

    expect(authService.logout).toHaveBeenCalledWith("sess1");
    expect(clearSessionCookie).toHaveBeenCalledWith(authenticatedCtx.res);
    expect(result.success).toBe(true);
  });

  it("me should return user from context", async () => {
    const ctx = getMockCtx();
    const authenticatedCtx = {
      ...ctx,
      user: { id: "u3", name: "Alice", email: "alice@example.com" },
    } as unknown as TRPCContext;

    vi.mocked(authService.resolveUser).mockResolvedValueOnce({
      user: authenticatedCtx.user as any,
      session: null as any,
    });

    const caller = authRouter.createCaller(authenticatedCtx);

    const result = await caller.me(undefined);

    expect(result.user.name).toBe("Alice");
  });

  it("forgotPassword should call authService", async () => {
    const ctx = getMockCtx();
    const caller = authRouter.createCaller(ctx);
    vi.mocked(authService.forgotPassword).mockResolvedValueOnce(undefined);

    const result = await caller.forgotPassword({ email: "test@example.com" });

    expect(authService.forgotPassword).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("resetPassword should call authService", async () => {
    const ctx = getMockCtx();
    const caller = authRouter.createCaller(ctx);
    vi.mocked(authService.resetPassword).mockResolvedValueOnce(undefined);

    // Provide a valid 64-char hex token
    const token = "a".repeat(64);
    const result = await caller.resetPassword({ token, newPassword: "NewPassword1!" });

    expect(authService.resetPassword).toHaveBeenCalledWith({ token, newPassword: "NewPassword1!" });
    expect(result.success).toBe(true);
  });
});
