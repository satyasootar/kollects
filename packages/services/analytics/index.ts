import { db, eq, and, sql, desc, inArray, gte, lte } from "@repo/database";
import { 
  formsTable, 
  formAnalyticsDailyTable, 
  formViewsTable,
  formResponsesTable,
  responseAnswersTable,
  formFieldsTable
} from "@repo/database/schema";
import { TRPCError } from "@trpc/server";
import { cache } from "../cache";

export class AnalyticsService {
  /**
   * Helper to assert ownership of a form.
   */
  private async enforceFormOwnership(userId: string, formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: and(
        eq(formsTable.id, formId),
        eq(formsTable.creatorId, userId)
      ),
    });

    if (!form) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this form's analytics" });
    }
    
    return form;
  }

  /**
   * Retrieves high-level overview stats directly from the form counters.
   */
  async getOverview(userId: string, formId: string) {
    const cacheKey = `analytics:overview:${formId}`;
    const cached = await cache.get<{ totalViews: number; totalStarts: number; totalSubmissions: number; completionRate: number; }>(cacheKey);
    if (cached) return cached;

    // Verify ownership
    const [form] = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.id, formId), eq(formsTable.creatorId, userId)))
      .limit(1);

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or access denied" });
    }

    const completionRate = form.totalStarts > 0
      ? (form.totalSubmissions / form.totalStarts) * 100
      : 0;

    const result = {
      totalViews: form.totalViews,
      totalStarts: form.totalStarts,
      totalSubmissions: form.totalSubmissions,
      completionRate: Number(completionRate.toFixed(1)),
    };

    await cache.set(cacheKey, result, 300); // 5 minutes TTL
    return result;
  }

  /**
   * Retrieves daily stats for a specific date range.
   */
  async getDailyStats(userId: string, formId: string, startDate: Date, endDate: Date) {
    await this.enforceFormOwnership(userId, formId);

    const stats = await db.query.formAnalyticsDailyTable.findMany({
      where: and(
        eq(formAnalyticsDailyTable.formId, formId),
        gte(formAnalyticsDailyTable.date, startDate),
        lte(formAnalyticsDailyTable.date, endDate)
      ),
      orderBy: [desc(formAnalyticsDailyTable.date)],
    });

    return stats.map(stat => ({
      ...stat,
      completionRate: stat.completionRate / 100, // convert back to percentage representation if stored as integer * 100
    }));
  }

  /**
   * Retrieves drop-off metrics per page based on incomplete responses.
   */
  async getDropoffByPage(userId: string, formId: string) {
    await this.enforceFormOwnership(userId, formId);

    // Get all incomplete responses for the form
    const incompleteResponses = await db.query.formResponsesTable.findMany({
      where: and(
        eq(formResponsesTable.formId, formId),
        eq(formResponsesTable.isComplete, false)
      ),
      columns: {
        id: true,
        metadata: true,
      }
    });

    // Group by lastCompletedPage
    const dropoffs: Record<number, number> = {};
    for (const res of incompleteResponses) {
      const metadata = res.metadata as Record<string, any> || {};
      const page = typeof metadata.lastCompletedPage === 'number' ? metadata.lastCompletedPage : 1;
      dropoffs[page] = (dropoffs[page] || 0) + 1;
    }

    return Object.entries(dropoffs).map(([page, count]) => ({
      page: parseInt(page, 10),
      dropoffs: count,
    }));
  }

  /**
   * Aggregates answers for a specific field based on its type.
   */
  async getFieldStats(userId: string, formId: string, fieldId: string) {
    await this.enforceFormOwnership(userId, formId);

    // 1. Verify field exists on this form
    const field = await db.query.formFieldsTable.findFirst({
      where: and(
        eq(formFieldsTable.id, fieldId),
        eq(formFieldsTable.formId, formId)
      )
    });

    if (!field) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });
    }

    // 2. Fetch all completed responses for this form to filter answers
    const completedResponses = await db.select({ id: formResponsesTable.id })
      .from(formResponsesTable)
      .where(and(eq(formResponsesTable.formId, formId), eq(formResponsesTable.isComplete, true)));

    if (completedResponses.length === 0) {
      return { type: field.type, stats: null, totalAnswers: 0 };
    }

    const responseIds = completedResponses.map(r => r.id);

    // 3. Fetch answers for this field that belong to completed responses
    const answers = await db.query.responseAnswersTable.findMany({
      where: and(
        eq(responseAnswersTable.fieldId, fieldId),
        inArray(responseAnswersTable.responseId, responseIds)
      ),
      columns: {
        value: true,
      }
    });

    const totalAnswers = answers.length;
    if (totalAnswers === 0) {
      return { type: field.type, stats: null, totalAnswers: 0 };
    }

    // 4. Compute aggregations based on field type
    let stats: any = {};

    switch (field.type) {
      case "rating": {
        let sum = 0;
        const distribution: Record<number, number> = {};
        for (const ans of answers) {
          const val = Number(ans.value);
          if (!isNaN(val)) {
            sum += val;
            distribution[val] = (distribution[val] || 0) + 1;
          }
        }
        stats = {
          average: Math.round((sum / totalAnswers) * 10) / 10,
          distribution,
        };
        break;
      }
      case "single_select": {
        const counts: Record<string, number> = {};
        for (const ans of answers) {
          const val = String(ans.value);
          counts[val] = (counts[val] || 0) + 1;
        }
        stats = { counts };
        break;
      }
      case "multi_select": {
        const counts: Record<string, number> = {};
        for (const ans of answers) {
          if (Array.isArray(ans.value)) {
            for (const item of ans.value) {
              const val = String(item);
              counts[val] = (counts[val] || 0) + 1;
            }
          }
        }
        stats = { counts };
        break;
      }
      case "number": {
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        for (const ans of answers) {
          const val = Number(ans.value);
          if (!isNaN(val)) {
            sum += val;
            if (val < min) min = val;
            if (val > max) max = val;
          }
        }
        stats = {
          average: Math.round((sum / totalAnswers) * 100) / 100,
          min: min === Infinity ? null : min,
          max: max === -Infinity ? null : max,
        };
        break;
      }
      case "checkbox": {
        let trueCount = 0;
        let falseCount = 0;
        for (const ans of answers) {
          if (ans.value === true || ans.value === "true") trueCount++;
          else falseCount++;
        }
        stats = { trueCount, falseCount };
        break;
      }
      default:
        // Text, email, url, phone, etc. We just return total count.
        stats = { textCount: totalAnswers };
        break;
    }

    return { type: field.type, stats, totalAnswers };
  }

  // --- Tracking Methods --- //

  /**
   * Records a form view.
   */
  async recordView(formId: string, ipHash?: string, sessionId?: string, referrer?: string) {
    await db.transaction(async (tx) => {
      // 1. Insert view event
      await tx.insert(formViewsTable).values({
        formId,
        ipHash,
        sessionId,
        referrer,
      });

      // 2. Increment totalViews atomically
      await tx.update(formsTable)
        .set({ totalViews: sql`${formsTable.totalViews} + 1` })
        .where(eq(formsTable.id, formId));
    });
  }

  /**
   * Records a form start (user interacts with first field).
   */
  async recordStart(formId: string) {
    await db.update(formsTable)
      .set({ totalStarts: sql`${formsTable.totalStarts} + 1` })
      .where(eq(formsTable.id, formId));
  }

  /**
   * Upserts the daily analytics roll-up. Called during submission.
   */
  async upsertDailyAnalytics(formId: string, date: Date) {
    // Strip time portion for exact date matching
    const strippedDate = new Date(date);
    strippedDate.setUTCHours(0, 0, 0, 0);

    // In a real high-throughput system this could be queued, but we use atomic upsert here.
    await db.insert(formAnalyticsDailyTable)
      .values({
        formId,
        date: strippedDate,
        views: 0,
        starts: 0,
        submissions: 1, // Called on submission
      })
      .onConflictDoUpdate({
        target: [formAnalyticsDailyTable.formId, formAnalyticsDailyTable.date],
        set: {
          submissions: sql`${formAnalyticsDailyTable.submissions} + 1`,
          updatedAt: new Date()
        }
      });
  }
}
