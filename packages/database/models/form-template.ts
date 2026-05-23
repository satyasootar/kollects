import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { themesTable, themeCategoryEnum } from "./theme";

export const formTemplatesTable = pgTable("form_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  
  category: themeCategoryEnum("category").default("other").notNull(),
  themeId: uuid("theme_id").references(() => themesTable.id, { onDelete: "set null" }),
  
  previewImageUrl: text("preview_image_url"),
  definition: jsonb("definition").notNull().$type<Record<string, any>>(),
  tags: jsonb("tags").$type<string[]>(),
  
  isFeatured: boolean("is_featured").default(false).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  useCount: integer("use_count").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const formTemplatesRelations = relations(formTemplatesTable, ({ one }) => ({
  theme: one(themesTable, {
    fields: [formTemplatesTable.themeId],
    references: [themesTable.id],
  }),
}));

export type SelectFormTemplate = typeof formTemplatesTable.$inferSelect;
export type InsertFormTemplate = typeof formTemplatesTable.$inferInsert;
