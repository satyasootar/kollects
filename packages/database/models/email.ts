import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formsTable } from "./form";
import { formFieldsTable } from "./form-field";
import { formResponsesTable } from "./form-response";

export const emailLogTypeEnum = pgEnum("email_log_type", [
  "creator_notification",
  "respondent_confirmation",
  "weekly_digest",
  "password_reset",
]);

export const emailLogStatusEnum = pgEnum("email_log_status", ["pending", "sent", "failed"]);

export const emailNotificationSettingsTable = pgTable("email_notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .unique()
    .references(() => formsTable.id, { onDelete: "cascade" }),

  creatorNotifyOnSubmission: boolean("creator_notify_on_submission").default(false).notNull(),
  creatorNotifyEmail: varchar("creator_notify_email", { length: 255 }),
  creatorEmailSubject: text("creator_email_subject"),
  creatorEmailTemplate: text("creator_email_template"),

  respondentConfirmationEnabled: boolean("respondent_confirmation_enabled")
    .default(false)
    .notNull(),
  respondentEmailFieldId: uuid("respondent_email_field_id").references(() => formFieldsTable.id, {
    onDelete: "set null",
  }),
  respondentEmailSubject: text("respondent_email_subject"),
  respondentEmailTemplate: text("respondent_email_template"),

  weeklyDigestEnabled: boolean("weekly_digest_enabled").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const emailLogsTable = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id").references(() => formsTable.id, { onDelete: "set null" }),
    responseId: uuid("response_id").references(() => formResponsesTable.id, {
      onDelete: "set null",
    }),

    type: emailLogTypeEnum("type").notNull(),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    subject: text("subject"),
    htmlContent: text("html_content"), // Storing full HTML per user request

    status: emailLogStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),

    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    formIdx: index("idx_email_logs_form").on(table.formId),
  }),
);

export const emailNotificationSettingsRelations = relations(
  emailNotificationSettingsTable,
  ({ one }) => ({
    form: one(formsTable, {
      fields: [emailNotificationSettingsTable.formId],
      references: [formsTable.id],
    }),
    respondentEmailField: one(formFieldsTable, {
      fields: [emailNotificationSettingsTable.respondentEmailFieldId],
      references: [formFieldsTable.id],
    }),
  }),
);

export const emailLogsRelations = relations(emailLogsTable, ({ one }) => ({
  form: one(formsTable, {
    fields: [emailLogsTable.formId],
    references: [formsTable.id],
  }),
  response: one(formResponsesTable, {
    fields: [emailLogsTable.responseId],
    references: [formResponsesTable.id],
  }),
}));

export type SelectEmailNotificationSetting = typeof emailNotificationSettingsTable.$inferSelect;
export type InsertEmailNotificationSetting = typeof emailNotificationSettingsTable.$inferInsert;
export type SelectEmailLog = typeof emailLogsTable.$inferSelect;
export type InsertEmailLog = typeof emailLogsTable.$inferInsert;
