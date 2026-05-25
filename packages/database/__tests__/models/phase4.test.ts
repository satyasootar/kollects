import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../index";
import { usersTable } from "../../models/user";
import { formsTable } from "../../models/form";
import { formAnalyticsDailyTable, formViewsTable } from "../../models/analytics";
import { emailNotificationSettingsTable, emailLogsTable } from "../../models/email";
import { apiKeysTable, auditLogsTable } from "../../models/system";
import { eq } from "drizzle-orm";

describe("Phase 4 Domain Models", () => {
  let testUserId: string;
  let testFormId: string;

  beforeAll(async () => {
    const user = await db
      .insert(usersTable)
      .values({
        name: "Phase 4 Test User",
        email: "phase4@example.com",
      })
      .returning();
    testUserId = user[0]!.id;

    const form = await db
      .insert(formsTable)
      .values({
        creatorId: testUserId,
        title: "Analytics Form",
        slug: "analytics-form-test",
      })
      .returning();
    testFormId = form[0]!.id;
  });

  afterAll(async () => {
    await db.delete(usersTable).where(eq(usersTable.id, testUserId));
  });

  it("should insert analytics daily entry", async () => {
    const entry = await db
      .insert(formAnalyticsDailyTable)
      .values({
        formId: testFormId,
        date: new Date(),
        views: 10,
        submissions: 2,
      })
      .returning();

    expect(entry).toHaveLength(1);
    expect(entry[0]!.views).toBe(10);
  });

  it("should insert form view", async () => {
    const view = await db
      .insert(formViewsTable)
      .values({
        formId: testFormId,
        ipHash: "testhash123",
        metadata: { browser: "chrome" },
      })
      .returning();

    expect(view).toHaveLength(1);
    expect(view[0]!.metadata).toHaveProperty("browser", "chrome");
  });

  it("should insert email notification setting", async () => {
    const setting = await db
      .insert(emailNotificationSettingsTable)
      .values({
        formId: testFormId,
        creatorNotifyOnSubmission: true,
        creatorNotifyEmail: "notify@example.com",
      })
      .returning();

    expect(setting).toHaveLength(1);
    expect(setting[0]!.creatorNotifyEmail).toBe("notify@example.com");
  });

  it("should insert email log with HTML content", async () => {
    const log = await db
      .insert(emailLogsTable)
      .values({
        formId: testFormId,
        type: "creator_notification",
        toEmail: "notify@example.com",
        htmlContent: "<h1>New Submission</h1><p>Data</p>",
      })
      .returning();

    expect(log).toHaveLength(1);
    expect(log[0]!.htmlContent).toContain("<h1>");
  });

  it("should insert api key with jsonb scopes", async () => {
    const key = await db
      .insert(apiKeysTable)
      .values({
        userId: testUserId,
        name: "Zapier Integration",
        keyHash: "hashedkey123",
        keyPrefix: "pk_live_",
        scopes: ["forms:read", "responses:read"],
      })
      .returning();

    expect(key).toHaveLength(1);
    expect(key[0]!.scopes).toContain("forms:read");
  });

  it("should insert audit log with metadata", async () => {
    const log = await db
      .insert(auditLogsTable)
      .values({
        userId: testUserId,
        action: "form_updated",
        entityType: "form",
        entityId: testFormId,
        metadata: { previousTitle: "Old Title" },
      })
      .returning();

    expect(log).toHaveLength(1);
    expect(log[0]!.action).toBe("form_updated");
  });
});
