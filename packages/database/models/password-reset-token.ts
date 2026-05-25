import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./user";

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokensRelations = relations(passwordResetTokensTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [passwordResetTokensTable.userId],
    references: [usersTable.id],
  }),
}));

export type SelectPasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokensTable.$inferInsert;
