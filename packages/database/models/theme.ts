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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./user";
import { formsTable } from "./form";

export const themeCategoryEnum = pgEnum("theme_category", [
  "minimal",
  "corporate",
  "comic",
  "anime",
  "os",
  "nature",
  "other",
]);

export const colorSchemeEnum = pgEnum("color_scheme", ["light", "dark", "system"]);

export const themesTable = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),

  category: themeCategoryEnum("category").default("other").notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  isCustomizable: boolean("is_customizable").default(true).notNull(),
  colorScheme: colorSchemeEnum("color_scheme").default("system").notNull(),

  creatorId: uuid("creator_id").references(() => usersTable.id, { onDelete: "set null" }),

  config: jsonb("config").notNull().$type<Record<string, any>>(),

  thumbnailUrl: text("thumbnail_url"),
  isPublic: boolean("is_public").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const themesRelations = relations(themesTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [themesTable.creatorId],
    references: [usersTable.id],
  }),
  forms: many(formsTable),
}));

export type SelectTheme = typeof themesTable.$inferSelect;
export type InsertTheme = typeof themesTable.$inferInsert;
