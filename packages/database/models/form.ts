import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./user";
import { themesTable } from "./theme";
import { formFieldsTable } from "./form-field";
import { formResponsesTable } from "./form-response";
import { formAnalyticsDailyTable, formViewsTable } from "./analytics";
import { emailNotificationSettingsTable, emailLogsTable } from "./email";

export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);
export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted"]);

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id").references(() => themesTable.id, { onDelete: "set null" }),
    
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    
    status: formStatusEnum("status").default("draft").notNull(),
    visibility: formVisibilityEnum("visibility").default("public").notNull(),
    
    passwordHash: varchar("password_hash", { length: 255 }),
    responseLimit: integer("response_limit"),
    expiresAt: timestamp("expires_at"),

    metaTitle: varchar("meta_title", { length: 60 }),
    metaDescription: text("meta_description"),
    
    totalViews: integer("total_views").default(0).notNull(),
    totalStarts: integer("total_starts").default(0).notNull(),
    totalSubmissions: integer("total_submissions").default(0).notNull(),
    
    settings: jsonb("settings").notNull().default({}),
    
    publishedAt: timestamp("published_at"),
    archivedAt: timestamp("archived_at"),
    deletedAt: timestamp("deleted_at"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    creatorIdx: index("idx_forms_creator").on(table.creatorId),
    slugIdx: index("idx_forms_slug").on(table.slug),
  })
);

export const formsRelations = relations(formsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [formsTable.creatorId],
    references: [usersTable.id],
  }),
  theme: one(themesTable, {
    fields: [formsTable.themeId],
    references: [themesTable.id],
  }),
  fields: many(formFieldsTable),
  responses: many(formResponsesTable),
  analyticsDaily: many(formAnalyticsDailyTable),
  views: many(formViewsTable),
  emailSettings: one(emailNotificationSettingsTable, { fields: [formsTable.id], references: [emailNotificationSettingsTable.formId] }),
  emailLogs: many(emailLogsTable),
}));

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
