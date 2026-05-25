import { z } from "zod";

// Auth types
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth";

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Form types
import { createFormSchema, updateFormSchema, publishFormSchema } from "../schemas/form";

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type PublishFormInput = z.infer<typeof publishFormSchema>;

// Field types
import { createFieldSchema, updateFieldSchema, reorderFieldsSchema } from "../schemas/field";

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;

// Response types
import { submitResponseSchema, listResponsesSchema } from "../schemas/response";

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
export type ListResponsesInput = z.infer<typeof listResponsesSchema>;

// Analytics types
import { analyticsQuerySchema, dailyStatsSchema } from "../schemas/analytics";

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type DailyStats = z.infer<typeof dailyStatsSchema>;

// Theme types
import { createThemeSchema, updateThemeSchema } from "../schemas/theme";

export type CreateThemeInput = z.infer<typeof createThemeSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

// API Key types
import { createApiKeySchema, revokeApiKeySchema } from "../schemas/api-key";

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;

// Template types
import { createTemplateSchema, useTemplateSchema } from "../schemas/template";

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UseTemplateInput = z.infer<typeof useTemplateSchema>;

// Email settings types
import { updateEmailSettingsSchema } from "../schemas/email-settings";

export type UpdateEmailSettingsInput = z.infer<typeof updateEmailSettingsSchema>;

// Pagination types
import { offsetPaginationSchema, cursorPaginationSchema } from "../schemas/pagination";

export type OffsetPaginationInput = z.infer<typeof offsetPaginationSchema>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

// Re-export utility types
export type { Paginated, CursorPaginated, RequireKeys, OptionalKeys } from "./utility";
