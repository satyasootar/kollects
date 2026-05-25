import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("8000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BASE_URL: z.string().default("http://localhost:8000"),
  CORS_ORIGINS: z.string().optional().default("*"),
}).refine(data => {
  if (data.NODE_ENV === "production" && (!data.CORS_ORIGINS || data.CORS_ORIGINS === "*")) {
    return false;
  }
  return true;
}, {
  message: "CORS_ORIGINS must be explicitly set to a specific domain in production. Wildcards (*) are not allowed.",
  path: ["CORS_ORIGINS"]
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    console.error("❌ Invalid environment variables:", safeParseResult.error.format());
    process.exit(1);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);
