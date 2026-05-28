import { logger } from "@repo/logger";
import { EmailService } from "../email";
import { AnalyticsService } from "../analytics";
import { db, sql } from "@repo/database";
import { emailLogsTable } from "@repo/database/models/email";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
  private queue: { type: string; payload: any; attempts?: number; idempotencyKey?: string }[] = [];
  private isSaving = false;
  private savePending = false;
  private processedKeys = new Set<string>();
  private readonly maxProcessedKeys = 5000;

  constructor() {
    this.registerHandlers();
    this.loadQueue();
  }

  private generateIdempotencyKey(type: string, payload: any): string {
    const hash = crypto.createHash("sha256").update(`${type}:${JSON.stringify(payload)}`).digest("hex").slice(0, 16);
    return hash;
  }

  async enqueue<T extends JobType>(type: T, payload: JobPayloads[T]): Promise<void> {
    const key = this.generateIdempotencyKey(type, payload);
    if (this.processedKeys.has(key)) return; // Skip duplicate

    if (process.env.VERCEL) {
      // Run synchronously on Vercel to ensure completion before the serverless function exits
      const handler = this.handlers.get(type);
      if (handler) {
        try {
          await handler(payload);
        } catch (error) {
          logger.error(`Job execution failed on Vercel: ${type}`, { error, payload });
        }
      }
      return;
    }

    this.queue.push({ type, payload, attempts: 1, idempotencyKey: key });
    this.saveQueue();
    if (!this.running) {
      this.processNext();
    }
  }

  process<T extends JobType>(type: T, handler: JobHandler<T>) {
    this.handlers.set(type, handler);
  }

  private async saveQueue() {
    if (this.isSaving) {
      this.savePending = true;
      return;
    }
    this.isSaving = true;
    try {
      const tempFile = `${PERSISTENCE_FILE}.tmp`;
      await fs.promises.writeFile(tempFile, JSON.stringify(this.queue, null, 2), "utf8");
      await fs.promises.rename(tempFile, PERSISTENCE_FILE);
    } catch (error) {
      logger.error("Failed to save background jobs to disk", { error });
    } finally {
      this.isSaving = false;
      if (this.savePending) {
        this.savePending = false;
        this.saveQueue();
      }
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

      const handler = this.handlers.get(job.type);
      if (handler) {
        let timeoutId: NodeJS.Timeout | undefined;
        try {
          // Implement a timeout to prevent stalled jobs from hanging the queue
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error("Job processing timeout")), 30000);
          });
          
          await Promise.race([handler(job.payload), timeoutPromise]);
          
          // Mark as processed for deduplication
          if (job.idempotencyKey) {
            this.processedKeys.add(job.idempotencyKey);
            if (this.processedKeys.size > this.maxProcessedKeys) {
              const first = this.processedKeys.values().next().value;
              if (first) this.processedKeys.delete(first);
            }
          }
        } catch (error) {
          logger.error(`Job execution failed: ${job.type}`, { error, payload: job.payload });

          const attempts = job.attempts || 1;
          if (attempts < 3) {
            logger.info(`Re-enqueuing job for retry (attempt ${attempts + 1}/3): ${job.type}`);
            this.queue.push({ ...job, attempts: attempts + 1 });
          } else {
            logger.error(`Job exhausted all retry attempts: ${job.type}`, { payload: job.payload });
          }
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      } else {
        logger.warn(`No handler registered for job type: ${job.type}`);
      }
    }

    // Save the queue to disk once after processing the batch
    this.saveQueue();

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

}

export const jobQueue = new JobQueue();
