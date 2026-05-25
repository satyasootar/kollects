import { TRPCError } from "@trpc/server";
import { middleware } from "../init";
import { authService } from "../services";
import type { Request } from "express";

/**
 * Auth middleware — resolves the current user from session cookie or Bearer API key.
 * Enriches the context with `user`, `session`, and `apiKeyScopes`.
 * Throws UNAUTHORIZED if no valid credentials are present.
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  const sessionToken = extractSessionToken(ctx.req);
  const apiKey = extractApiKey(ctx.req);

  const resolved = await authService.resolveUser({ sessionToken, apiKey });

  if (!resolved) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: resolved.user,
      session: "session" in resolved ? (resolved.session ?? null) : null,
      apiKeyScopes: "scopes" in resolved ? (resolved.scopes as string[]) : null,
    },
  });
});

/**
 * Extracts session token from cookie header.
 */
function extractSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match?.[1];
}

/**
 * Extracts API key from Authorization header: Bearer sk_live_...
 */
function extractApiKey(req: Request): string | undefined {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  const key = authHeader.slice(7).trim();
  return key.startsWith("sk_live_") ? key : undefined;
}
