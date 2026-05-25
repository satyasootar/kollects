import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import { db } from "@repo/database";
import type { SelectUser, SelectSession } from "@repo/database/schema";
import { hashIP } from "@repo/services/ip";
import crypto from "crypto";

/** Safe user type — passwordHash is always stripped before storing in context */
export type SafeUser = Omit<SelectUser, "passwordHash">;

export interface TRPCContext {
  db: typeof db;
  user: SafeUser | null;
  session: SelectSession | null;
  apiKeyScopes: string[] | null;
  ipHash: string;
  userAgent: string;
  requestMeta: {
    startTime: number;
    requestId: string;
  };
  /** Raw Express request — for reading cookies / auth headers */
  req: Request;
  /** Raw Express response — for setting cookies */
  res: Response;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TRPCContext> {
  const { req, res } = opts;

  const rawIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  return {
    db,
    user: null, // Populated by authMiddleware
    session: null, // Populated by authMiddleware
    apiKeyScopes: null, // Populated by authMiddleware for API key auth
    ipHash: hashIP(rawIp),
    userAgent: req.headers["user-agent"] ?? "unknown",
    requestMeta: {
      startTime: Date.now(),
      requestId: crypto.randomUUID(),
    },
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
