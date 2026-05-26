import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(""),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().optional().default(""),
    IP_HASH_SALT: z.string().min(16).default("dev-salt-1234567890"),
    IMAGEKIT_PUBLIC_KEY: z.string().optional(),
    IMAGEKIT_PRIVATE_KEY: z.string().optional(),
    IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional().default(465),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    JWT_SECRET: z.string().min(32),
    BASE_URL: z.string().default("https://kollects.tech"),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === "production" && data.IP_HASH_SALT === "dev-salt-1234567890") {
        return false;
      }
      return true;
    },
    {
      message: "IP_HASH_SALT must be changed from the default value in production",
      path: ["IP_HASH_SALT"],
    },
  );

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    console.error("❌ Invalid environment variables:", safeParseResult.error.format());
    throw new Error(safeParseResult.error.message);
  }
  return safeParseResult.data;
}

export const env = createEnv(process.env);
