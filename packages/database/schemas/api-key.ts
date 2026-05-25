import { z } from "zod";
import { API_SCOPES } from "../constants/api-scopes";
import { uuidSchema } from "./common";

/**
 * Create API key input schema.
 */
export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  scopes: z.array(z.enum(API_SCOPES)).min(1, "At least one scope is required"),
});

/**
 * Revoke API key input schema.
 */
export const revokeApiKeySchema = z.object({
  keyId: uuidSchema,
});
