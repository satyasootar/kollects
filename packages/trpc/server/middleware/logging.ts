import { middleware } from "../init";
import { logger } from "@repo/logger";

/** Fields that should never appear in logs */
const SENSITIVE_KEYS = new Set(["password", "newPassword", "token", "key", "secret", "hash"]);

function sanitizeInput(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(sanitizeInput);

  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    safe[k] = SENSITIVE_KEYS.has(k) ? "[REDACTED]" : sanitizeInput(v);
  }
  return safe;
}

/**
 * Logging middleware — logs procedure name, sanitized input, and result status.
 */
export const loggingMiddleware = middleware(async ({ ctx, path, type, input, next }) => {
  const sanitized = sanitizeInput(input);

  logger.debug(`→ [${type.toUpperCase()}] ${path}`, {
    requestId: ctx.requestMeta.requestId,
    input: sanitized,
    userId: ctx.user?.id ?? null,
  });

  const result = await next();

  if (result.ok) {
    logger.debug(`← [OK] ${path}`, { requestId: ctx.requestMeta.requestId });
  } else {
    logger.error(`← [ERR] ${path}`, {
      requestId: ctx.requestMeta.requestId,
      error: result.error.message,
      code: result.error.code,
    });
  }

  return result;
});
