import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sessionsTable } from "./session";
import { themesTable } from "./theme";
import { formsTable } from "./form";
import { passwordResetTokensTable } from "./password-reset-token";
import { apiKeysTable, auditLogsTable } from "./system";

export const userPlanEnum = pgEnum("user_plan", ["free", "pro", "enterprise"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  avatarUrl: text("avatar_url"),
  
  passwordHash: varchar("password_hash", { length: 255 }),
  plan: userPlanEnum("plan").default("free").notNull(),
  billingCustomerId: varchar("billing_customer_id", { length: 255 }),
  formLimit: integer("form_limit").default(5).notNull(),
  responseLimit: integer("response_limit").default(100).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
  passwordResetTokens: many(passwordResetTokensTable),
  themes: many(themesTable),
  forms: many(formsTable),
  apiKeys: many(apiKeysTable),
  auditLogs: many(auditLogsTable),
}));

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
