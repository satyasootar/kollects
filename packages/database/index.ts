import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";

export const db = drizzle(env.DATABASE_URL);
export * from "drizzle-orm";

// Export shared constants, schemas, types, and utilities
export * from "./constants";
export * from "./schemas";
export * from "./types";
export * from "./utils";

export default db;
