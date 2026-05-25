import { db, eq } from "@repo/database";
import { emailNotificationSettingsTable } from "@repo/database/schema";
import { updateEmailSettingsSchema } from "@repo/database/schemas/email-settings";
import { z } from "zod";
import { FormService } from "../form";
import { TRPCError } from "@trpc/server";

export class EmailSettingsService {
  async getSettings(userId: string, formId: string) {
    const formService = new FormService();
    // Re-use access control
    await formService.getById(userId, formId);

    const [settings] = await db
      .select()
      .from(emailNotificationSettingsTable)
      .where(eq(emailNotificationSettingsTable.formId, formId))
      .limit(1);

    if (!settings) {
      // Return default shape if none exists yet
      return {
        formId,
        creatorNotifyOnSubmission: false,
        creatorNotifyEmail: null,
        creatorEmailSubject: null,
        creatorEmailTemplate: null,
        respondentConfirmationEnabled: false,
        respondentEmailFieldId: null,
        respondentEmailSubject: null,
        respondentEmailTemplate: null,
        weeklyDigestEnabled: false,
      };
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    formId: string,
    data: z.infer<typeof updateEmailSettingsSchema>,
  ) {
    const formService = new FormService();
    await formService.getById(userId, formId);

    const validData = updateEmailSettingsSchema.parse(data);

    // Upsert mechanism since it's 1-to-1
    const [existing] = await db
      .select()
      .from(emailNotificationSettingsTable)
      .where(eq(emailNotificationSettingsTable.formId, formId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(emailNotificationSettingsTable)
        .set(validData)
        .where(eq(emailNotificationSettingsTable.formId, formId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(emailNotificationSettingsTable)
        .values({
          ...validData,
        })
        .returning();
      return inserted;
    }
  }
}
