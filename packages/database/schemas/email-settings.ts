import { z } from "zod";
import { uuidSchema } from "./common";

/**
 * Update email notification settings input schema.
 */
export const updateEmailSettingsSchema = z.object({
  formId: uuidSchema,
  creatorNotifyOnSubmission: z.boolean().optional(),
  creatorNotifyEmail: z.string().email().optional().nullable(),
  creatorEmailSubject: z.string().max(200).trim().optional(),
  creatorEmailTemplate: z.string().max(5000).trim().optional(),
  respondentConfirmationEnabled: z.boolean().optional(),
  respondentEmailFieldId: uuidSchema.optional().nullable(),
  respondentEmailSubject: z.string().max(200).trim().optional(),
  respondentEmailTemplate: z.string().max(5000).trim().optional(),
  weeklyDigestEnabled: z.boolean().optional(),
});
