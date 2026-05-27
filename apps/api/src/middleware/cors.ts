import cors from "cors";
import { env } from "../env";

const allowlist = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((s) => s.trim()) : [];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In development or if origin is missing (e.g. server-to-server), allow it
    if (env.NODE_ENV !== "production" || !origin) {
      return callback(null, true);
    }

    // Always fetch latest allowlist to prevent caching issues if the variable changed
    const currentOrigins = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((s) => s.trim()) : [];

    // In production, check allowlist
    if (currentOrigins.includes(origin) || currentOrigins.includes("*")) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    callback(null, false); // Gracefully fail CORS without crashing the request chain
  },
  credentials: true, // Allow cookies
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
});
