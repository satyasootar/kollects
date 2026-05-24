import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("8000"),
  NODE_ENV: z.enum(["development", "prod", "test"]).default("development"),
  BASE_URL: z.string().default("http://localhost:8000"),
  CORS_ORIGINS: z.string().optional().default("*"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
