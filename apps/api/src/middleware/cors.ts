import cors from "cors";
import { env } from "../env";

const allowlist = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((s) => s.trim()) : [];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In development or if origin is missing (e.g. server-to-server), allow it
    if (env.NODE_ENV !== "production" || !origin) {
      return callback(null, true);
    }

    // In production, check allowlist
    if (allowlist.includes(origin) || allowlist.includes("*")) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // Allow cookies
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
});
