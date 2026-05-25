import { logger } from "@repo/logger";
import { EmailService } from "../email";
import { AnalyticsService } from "../analytics";
import { db, sql } from "@repo/database";
import { rateLimitEntriesTable } from "@repo/database/models/system";
import { sessionsTable } from "@repo/database/models/session";

type JobPayloads = {
  EMAIL_NOTIFICATION: {
    formId: string;
    responseId: string;
  };
  ANALYTICS_UPDATE: {
    formId: string;
    dateStr: string;
  };
};

type JobType = keyof JobPayloads;
type JobHandler<T extends JobType> = (payload: JobPayloads[T]) => Promise<void>;

export class JobQueue {
  private handlers = new Map<string, JobHandler<any>>();
  private running = false;
  private queue: { type: string; payload: any }[] = [];

  constructor() {
    this.registerHandlers();
  }

  enqueue<T extends JobType>(type: T, payload: JobPayloads[T]) {
    this.queue.push({ type, payload });
    if (!this.running) {
      this.processNext();
    }
  }

  process<T extends JobType>(type: T, handler: JobHandler<T>) {
    this.handlers.set(type, handler);
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;
    const job = this.queue.shift();

    if (job) {
      const handler = this.handlers.get(job.type);
      if (handler) {
        try {
          await handler(job.payload);
        } catch (error) {
          logger.error(`Job execution failed: ${job.type}`, { error, payload: job.payload });
        }
      } else {
        logger.warn(`No handler registered for job type: ${job.type}`);
      }
    }

    // Schedule next immediately (but yielded to event loop)
    setTimeout(() => this.processNext(), 0);
  }

  private registerHandlers() {
    const emailService = new EmailService();
    const analyticsService = new AnalyticsService();

    this.process("EMAIL_NOTIFICATION", async (payload) => {
      // Send both creator and respondent emails concurrently
      await Promise.allSettled([
        emailService.sendCreatorNotification(payload.formId, payload.responseId),
        emailService.sendRespondentConfirmation(payload.formId, payload.responseId),
      ]);
    });

    this.process("ANALYTICS_UPDATE", async (payload) => {
      await analyticsService.upsertDailyAnalytics(payload.formId, new Date(payload.dateStr));
    });
  }

  startCronTasks() {
    // RATE_LIMIT_CLEANUP: Every 2 hours
    setInterval(() => {
      this.cleanupRateLimits();
    }, 2 * 60 * 60 * 1000);

    // SESSION_CLEANUP: Daily
    setInterval(() => {
      this.cleanupSessions();
    }, 24 * 60 * 60 * 1000);
    
    // Run an initial cleanup on startup
    this.cleanupRateLimits();
    this.cleanupSessions();
  }

  private async cleanupRateLimits() {
    try {
      // Delete entries older than 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const res = await db.delete(rateLimitEntriesTable)
        .where(sql`${rateLimitEntriesTable.windowStart} < ${twoHoursAgo}`);
      logger.info(`Cleaned up old rate limit entries`);
    } catch (error) {
      logger.error("Failed to clean up rate limits", { error });
    }
  }

  private async cleanupSessions() {
    try {
      // Delete expired sessions
      const now = new Date();
      await db.delete(sessionsTable)
        .where(sql`${sessionsTable.expiresAt} < ${now}`);
      logger.info(`Cleaned up expired sessions`);
    } catch (error) {
      logger.error("Failed to clean up sessions", { error });
    }
  }
}

export const jobQueue = new JobQueue();
