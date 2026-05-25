import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formsTable } from "./form";

export const formAnalyticsDailyTable = pgTable(
  "form_analytics_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    views: integer("views").default(0).notNull(),
    starts: integer("starts").default(0).notNull(),
    submissions: integer("submissions").default(0).notNull(),
    completionRate: integer("completion_rate").default(0).notNull(), // stored as percentage * 100
    avgCompletionTimeSeconds: integer("avg_completion_time_seconds").default(0).notNull(),
    bounces: integer("bounces").default(0).notNull(),
    dropoffs: integer("dropoffs").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueFormDate: uniqueIndex("idx_analytics_form_date").on(table.formId, table.date),
  }),
);

export const formViewsTable = pgTable(
  "form_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    referrer: text("referrer"),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (table) => ({
    formIdx: index("idx_form_views_form").on(table.formId),
  }),
);

export const formAnalyticsDailyRelations = relations(formAnalyticsDailyTable, ({ one }) => ({
  form: one(formsTable, {
    fields: [formAnalyticsDailyTable.formId],
    references: [formsTable.id],
  }),
}));

export const formViewsRelations = relations(formViewsTable, ({ one }) => ({
  form: one(formsTable, {
    fields: [formViewsTable.formId],
    references: [formsTable.id],
  }),
}));

export type SelectFormAnalyticsDaily = typeof formAnalyticsDailyTable.$inferSelect;
export type InsertFormAnalyticsDaily = typeof formAnalyticsDailyTable.$inferInsert;
export type SelectFormView = typeof formViewsTable.$inferSelect;
export type InsertFormView = typeof formViewsTable.$inferInsert;
