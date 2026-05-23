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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./user";

export const apiKeysTable = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
    
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
  
  scopes: jsonb("scopes").notNull().$type<string[]>(),
  
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  hashIdx: index("idx_api_keys_hash").on(table.keyHash),
}));

export const rateLimitEntriesTable = pgTable("rate_limit_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // IP or User ID
  action: varchar("action", { length: 100 }).notNull(),
  windowStart: timestamp("window_start").notNull(),
  count: integer("count").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => ({
  uniqueEntry: uniqueIndex("idx_rate_limit_entry").on(table.identifier, table.action, table.windowStart),
}));

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // e.g., "form", "response"
  entityId: uuid("entity_id"),
  
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 64 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userActionIdx: index("idx_audit_logs_user").on(table.userId),
  entityIdx: index("idx_audit_logs_entity").on(table.entityType, table.entityId),
}));

export const apiKeysRelations = relations(apiKeysTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [apiKeysTable.userId],
    references: [usersTable.id],
  }),
}));

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [auditLogsTable.userId],
    references: [usersTable.id],
  }),
}));

export type SelectApiKey = typeof apiKeysTable.$inferSelect;
export type InsertApiKey = typeof apiKeysTable.$inferInsert;
export type SelectRateLimitEntry = typeof rateLimitEntriesTable.$inferSelect;
export type InsertRateLimitEntry = typeof rateLimitEntriesTable.$inferInsert;
export type SelectAuditLog = typeof auditLogsTable.$inferSelect;
export type InsertAuditLog = typeof auditLogsTable.$inferInsert;
