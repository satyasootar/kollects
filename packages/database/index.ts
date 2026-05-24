import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
export * from "drizzle-orm";

// Export shared constants, schemas, types, and utilities
export * from "./constants";
export * from "./schemas";
export * from "./types";
export * from "./utils";

export default db;
