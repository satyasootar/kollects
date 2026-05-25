import nodemailer from "nodemailer";
import { env } from "../env";
import { logger } from "@repo/logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailClient {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`Initialized Nodemailer for ${env.SMTP_HOST}`);
    } else {
      logger.warn("SMTP credentials not provided. Email client will simulate sending.");
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      if (!this.transporter) {
        logger.info(`[SIMULATED EMAIL] To: ${options.to} | Subject: ${options.subject}`);
        return { success: true, messageId: "simulated-" + Date.now() };
      }

      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM || '"KOLLECTS" <no-reply@kollects.tech>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error("Failed to send email", { error: error.message, stack: error.stack });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const emailClient = new EmailClient();
