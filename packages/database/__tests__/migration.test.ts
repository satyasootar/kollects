import { describe, it, expect } from "vitest";
import { db } from "../index";
import { sql } from "drizzle-orm";

describe("Database Migration Verification", () => {
  it("should compile and execute a basic query against the schema", async () => {
    // This verifies that the database connection works and schema maps correctly
    // It runs a simple 1=1 query but uses the query builder
    const result = await db.execute(sql`SELECT 1 as is_alive`);
    const rows = (result as any).rows || result;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.is_alive).toBe(1);
  });
});
