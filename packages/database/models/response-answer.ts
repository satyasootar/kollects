import { pgTable, uuid, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formResponsesTable } from "./form-response";
import { formFieldsTable } from "./form-field";

export const responseAnswersTable = pgTable(
  "response_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => formResponsesTable.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "cascade" }),

    value: jsonb("value").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    responseIdx: index("idx_response_answers_response").on(table.responseId),
    fieldIdx: index("idx_response_answers_field").on(table.fieldId),
  }),
);

export const responseAnswersRelations = relations(responseAnswersTable, ({ one }) => ({
  response: one(formResponsesTable, {
    fields: [responseAnswersTable.responseId],
    references: [formResponsesTable.id],
  }),
  field: one(formFieldsTable, {
    fields: [responseAnswersTable.fieldId],
    references: [formFieldsTable.id],
  }),
}));

export type SelectResponseAnswer = typeof responseAnswersTable.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswersTable.$inferInsert;
