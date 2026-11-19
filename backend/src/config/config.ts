import dotenv from "dotenv";
import { z } from "zod";
import type { SignOptions } from "jsonwebtoken";

dotenv.config();

const secret = z.string().min(32, "must be at least 32 characters");
const envSchema = z
    .object({
        ENVIRONMENT: z.enum(["development", "test", "production"]),
        MONGODB_URI: z.string().min(1),
        JWT_ACCESS_SECRET: secret,
        JWT_REFRESH_SECRET: secret,
        IP_HASH_KEY: secret,
        CLIENT_URL: z.url().optional(),
        BACKEND_URL: z.url().optional(),
    })
    .superRefine((env, ctx) => {
        if (new Set([env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET, env.IP_HASH_KEY]).size < 3) {
            ctx.addIssue({ code: "custom", message: "JWT_ACCESS_SECRET, JWT_REFRESH_SECRET and IP_HASH_KEY must all be different" });
        }
        if (env.ENVIRONMENT === "production") {
            for (const key of ["CLIENT_URL", "BACKEND_URL"] as const) {
                if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "is required in production" });
            }
        }
    });

/**
 * Called first thing at startup: a missing or weak setting stops the server with a readable
 * message instead of silently falling back to something insecure.
 */
export function assertValidEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error(`Invalid environment configuration:
${z.prettifyError(result.error)}`);
        process.exit(1);
    }
}

interface Config {
    PORT: number | string;
    ENVIRONMENT: string;
    MONGODB_URI: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    IP_HASH_KEY: string;
    ACCESS_TOKEN_EXPIRY: SignOptions["expiresIn"];
    REFRESH_TOKEN_EXPIRY: SignOptions["expiresIn"];
    COOKIE_OPTIONS: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "strict" | "lax" | "none";
        maxAge: number;
    };
    RESEND_API_KEY: string;
    FROM_EMAIL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    CLIENT_URL: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    MISTRAL_API_KEY: string;
    MISTRAL_BASE_URL: string;
    MISTRAL_MODEL: string;
    ADMIN_EMAILS: string[];
}

const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const config: Config = {
    PORT: PORT,
    ENVIRONMENT: process.env.ENVIRONMENT || "", // required; see assertValidEnv
    MONGODB_URI: process.env.MONGODB_URI || "",
    // Separate secrets so a refresh token can never verify as an access token.
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
    // HMAC key for IP hashes; its own key, never shared with the JWT secrets.
    IP_HASH_KEY: process.env.IP_HASH_KEY || "",
    ACCESS_TOKEN_EXPIRY:
        (process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "15m",
    REFRESH_TOKEN_EXPIRY:
        (process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"]) || "7d",
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: process.env.ENVIRONMENT === "production",
        sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    FROM_EMAIL: process.env.FROM_EMAIL || "Kollects <noreply@kollects.tech>",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    GOOGLE_CALLBACK_URL: `${BACKEND_URL}/api/auth/google/callback`,
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || "",
    MISTRAL_BASE_URL: process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1",
    MISTRAL_MODEL: process.env.MISTRAL_MODEL || "mistral-small-latest",
    // Comma-separated. Only these (verified) accounts can reach /api/admin. Unset = no admins.
    ADMIN_EMAILS: (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
};

export default config;