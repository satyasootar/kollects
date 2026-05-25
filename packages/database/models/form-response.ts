import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { formsTable } from "./form";
import { responseAnswersTable } from "./response-answer";

export const formResponsesTable = pgTable(
  "form_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),

    respondentEmail: varchar("respondent_email", { length: 255 }),
    respondentName: varchar("respondent_name", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),
    referrer: text("referrer"),

    isComplete: boolean("is_complete").default(false).notNull(),
    completionTimeSeconds: integer("completion_time_seconds"),

    metadata: jsonb("metadata").$type<Record<string, any>>(),

    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    formIdx: index("idx_form_responses_form").on(table.formId),
    formCompleteSubmitIdx: index("idx_form_responses_complete_submit").on(
      table.formId,
      table.isComplete,
      table.submittedAt,
    ),
    formCompleteSessionIdx: index("idx_form_responses_session").on(
      table.formId,
      table.isComplete,
      sql`(${table.metadata}->>'sessionId')`,
    ),
  }),
);

export const formResponsesRelations = relations(formResponsesTable, ({ one, many }) => ({
  form: one(formsTable, {
    fields: [formResponsesTable.formId],
    references: [formsTable.id],
  }),
  answers: many(responseAnswersTable),
}));

export type SelectFormResponse = typeof formResponsesTable.$inferSelect;
export type InsertFormResponse = typeof formResponsesTable.$inferInsert;
