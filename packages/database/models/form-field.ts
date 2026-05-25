import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formsTable } from "./form";
import { responseAnswersTable } from "./response-answer";

export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "url",
  "phone",
]);

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),

    type: fieldTypeEnum("type").notNull(),
    label: text("label").notNull(),
    placeholder: text("placeholder"),
    helpText: text("help_text"),

    required: boolean("required").default(false).notNull(),
    order: integer("order").notNull(),
    pageNumber: integer("page_number").default(1).notNull(),

    options: jsonb("options").$type<Record<string, any>[]>(),
    logic: jsonb("logic").$type<Record<string, any>[]>(),
    settings: jsonb("settings").$type<Record<string, any>>(),
    validations: jsonb("validations").$type<Record<string, any>>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    formOrderIdx: index("idx_form_fields_order").on(table.formId, table.order),
  }),
);

export const formFieldsRelations = relations(formFieldsTable, ({ one, many }) => ({
  form: one(formsTable, {
    fields: [formFieldsTable.formId],
    references: [formsTable.id],
  }),
  answers: many(responseAnswersTable),
}));

export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
