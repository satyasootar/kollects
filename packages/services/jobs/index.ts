import { logger } from "@repo/logger";
import { EmailService } from "../email";
import { AnalyticsService } from "../analytics";
import { db, sql } from "@repo/database";
import { rateLimitEntriesTable } from "@repo/database/models/system";
import { sessionsTable } from "@repo/database/models/session";
import { emailLogsTable } from "@repo/database/models/email";
import fs from "fs";
import path from "path";

const PERSISTENCE_FILE = path.join(process.cwd(), ".jobs-persistence.json");

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
  private queue: { type: string; payload: any; attempts?: number }[] = [];

  constructor() {
    this.registerHandlers();
    this.loadQueue();
  }

  enqueue<T extends JobType>(type: T, payload: JobPayloads[T]) {
    this.queue.push({ type, payload, attempts: 1 });
    this.saveQueue();
    if (!this.running) {
      this.processNext();
    }
  }

  process<T extends JobType>(type: T, handler: JobHandler<T>) {
    this.handlers.set(type, handler);
  }

  private saveQueue() {
    try {
      fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(this.queue, null, 2), "utf8");
    } catch (error) {
      logger.error("Failed to save background jobs to disk", { error });
    }
  }

  private loadQueue() {
    try {
      if (fs.existsSync(PERSISTENCE_FILE)) {
        const data = fs.readFileSync(PERSISTENCE_FILE, "utf8");
        this.queue = JSON.parse(data);
        logger.info(`Restored ${this.queue.length} background jobs from disk`);
        if (this.queue.length > 0 && !this.running) {
          // Defer start to let handlers register
          setTimeout(() => {
            if (!this.running) this.processNext();
          }, 100);
        }
      }
    } catch (error) {
      logger.error("Failed to load background jobs from disk", { error });
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;

    // Process a max of 50 jobs per batch to prevent event loop blocking
    const batchSize = Math.min(this.queue.length, 50);

    for (let i = 0; i < batchSize; i++) {
      const job = this.queue.shift();
      if (!job) break;

      this.saveQueue();

      const handler = this.handlers.get(job.type);
      if (handler) {
        try {
          // Implement a timeout to prevent stalled jobs from hanging the queue
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Job processing timeout")), 30000),
          );
          await Promise.race([handler(job.payload), timeoutPromise]);
        } catch (error) {
          logger.error(`Job execution failed: ${job.type}`, { error, payload: job.payload });

          const attempts = job.attempts || 1;
          if (attempts < 3) {
            logger.info(`Re-enqueuing job for retry (attempt ${attempts + 1}/3): ${job.type}`);
            this.queue.push({ ...job, attempts: attempts + 1 });
            this.saveQueue();
          } else {
            logger.error(`Job exhausted all retry attempts: ${job.type}`, { payload: job.payload });
          }
        }
      } else {
        logger.warn(`No handler registered for job type: ${job.type}`);
      }
    }

    // Schedule next immediately if there's more in the queue
    if (this.queue.length > 0) {
      setTimeout(() => this.processNext(), 0);
    } else {
      this.running = false;
    }
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
    setInterval(
      () => {
        this.cleanupRateLimits();
      },
      2 * 60 * 60 * 1000,
    );

    // SESSION_CLEANUP: Daily
    setInterval(
      () => {
        this.cleanupSessions();
      },
      24 * 60 * 60 * 1000,
    );

    // EMAIL_LOGS_CLEANUP: Daily
    setInterval(
      () => {
        this.cleanupEmailLogs();
      },
      24 * 60 * 60 * 1000,
    );

    // Run an initial cleanup on startup
    this.cleanupRateLimits();
    this.cleanupSessions();
    this.cleanupEmailLogs();
  }

  private async cleanupRateLimits() {
    try {
      // Delete entries older than 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const res = await db
        .delete(rateLimitEntriesTable)
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
      await db.delete(sessionsTable).where(sql`${sessionsTable.expiresAt} < ${now}`);
      logger.info(`Cleaned up expired sessions`);
    } catch (error) {
      logger.error("Failed to clean up sessions", { error });
    }
  }

  private async cleanupEmailLogs() {
    try {
      // Clear HTML content from email logs older than 7 days to save space
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await db
        .update(emailLogsTable)
        .set({ htmlContent: null })
        .where(
          sql`${emailLogsTable.createdAt} < ${sevenDaysAgo} AND ${emailLogsTable.htmlContent} IS NOT NULL`,
        );
      logger.info(`Cleaned up old email log HTML content`);
    } catch (error) {
      logger.error("Failed to clean up email logs", { error });
    }
  }
}

export const jobQueue = new JobQueue();
