import { db, eq } from "@repo/database";
import {
  emailLogsTable,
  formsTable,
  usersTable,
  formFieldsTable,
  formResponsesTable,
  emailNotificationSettingsTable,
} from "@repo/database/schema";
import { emailClient } from "../clients/email";
import { renderTemplate } from "./templates";
import { logger } from "@repo/logger";
import sanitizeHtml from "sanitize-html";
import { env } from "../env";

export class EmailService {
  async sendCreatorNotification(formId: string, responseId: string) {
    try {
      // 1. Fetch form, settings, and creator
      const form = await db.query.formsTable.findFirst({
        where: eq(formsTable.id, formId),
        with: {
          creator: true,
          fields: true,
        },
      });

      if (!form) return;

      const settings = await db.query.emailNotificationSettingsTable.findFirst({
        where: eq(emailNotificationSettingsTable.formId, formId),
      });

      if (!settings || !settings.creatorNotifyOnSubmission) return;

      const toEmail = settings.creatorNotifyEmail || form.creator.email;

      // 2. Fetch response
      const response = await db.query.formResponsesTable.findFirst({
        where: eq(formResponsesTable.id, responseId),
        with: {
          answers: true,
        },
      });

      if (!response) return;

      // 3. Render template
      const variables = {
        form,
        creator: form.creator,
        response,
        fields: form.fields,
      };

      const defaultSubject = `New response for ${form.title}`;
      const defaultTemplate = `
        <h2>New Response Received!</h2>
        <p>A new response has been submitted to your form "<strong>{{form.title}}</strong>".</p>
        <p>Submitted at: {{response.submittedAt}}</p>
        <h3>Response Details:</h3>
        {{response.answersTable}}
        <br/>
        <a href="${env.BASE_URL}/forms/{{form.id}}/responses">View all responses</a>
      `;

      const subject = renderTemplate(settings.creatorEmailSubject || defaultSubject, variables);
      let htmlContent = renderTemplate(settings.creatorEmailTemplate || defaultTemplate, variables);
      htmlContent = sanitizeHtml(htmlContent, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          a: ["href", "target", "rel"],
          img: ["src", "alt", "width", "height"],
        },
      });

      // 4. Send email
      const result = await emailClient.sendEmail({
        to: toEmail,
        subject,
        html: htmlContent,
      });

      // 5. Log
      await db.insert(emailLogsTable).values({
        formId,
        responseId,
        type: "creator_notification",
        toEmail,
        subject,
        htmlContent,
        status: result.success ? "sent" : "failed",
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });
    } catch (error) {
      logger.error("Error in sendCreatorNotification", { error });
    }
  }

  async sendRespondentConfirmation(formId: string, responseId: string) {
    try {
      const form = await db.query.formsTable.findFirst({
        where: eq(formsTable.id, formId),
        with: {
          fields: true,
        },
      });

      if (!form) return;

      const settings = await db.query.emailNotificationSettingsTable.findFirst({
        where: eq(emailNotificationSettingsTable.formId, formId),
      });

      if (!settings || !settings.respondentConfirmationEnabled || !settings.respondentEmailFieldId)
        return;

      const response = await db.query.formResponsesTable.findFirst({
        where: eq(formResponsesTable.id, responseId),
        with: {
          answers: true,
        },
      });

      if (!response) return;

      const emailAnswer = response.answers.find(
        (a) => a.fieldId === settings.respondentEmailFieldId,
      );
      const respondentEmail = emailAnswer?.value as string;

      if (!respondentEmail || !respondentEmail.includes("@")) return;

      const variables = {
        form,
        response,
        fields: form.fields,
      };

      const defaultSubject = `Thank you for your response to ${form.title}`;
      const defaultTemplate = `
        <h2>Thank You!</h2>
        <p>We've received your response to "<strong>{{form.title}}</strong>".</p>
        <p>Submitted at: {{response.submittedAt}}</p>
        <h3>Your Answers:</h3>
        {{response.answersTable}}
      `;

      const subject = renderTemplate(settings.respondentEmailSubject || defaultSubject, variables);
      let htmlContent = renderTemplate(
        settings.respondentEmailTemplate || defaultTemplate,
        variables,
      );
      htmlContent = sanitizeHtml(htmlContent, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          a: ["href", "target", "rel"],
          img: ["src", "alt", "width", "height"],
        },
      });

      const result = await emailClient.sendEmail({
        to: respondentEmail,
        subject,
        html: htmlContent,
      });

      await db.insert(emailLogsTable).values({
        formId,
        responseId,
        type: "respondent_confirmation",
        toEmail: respondentEmail,
        subject,
        htmlContent,
        status: result.success ? "sent" : "failed",
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });
    } catch (error) {
      logger.error("Error in sendRespondentConfirmation", { error });
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    try {
      const resetLink = `${env.BASE_URL}/auth/reset-password?token=${token}`;

      const subject = "Reset your KOLLECTS.TECH password";
      const htmlContent = `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your KOLLECTS.TECH account.</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link expires in 1 hour.</p>
      `;

      const result = await emailClient.sendEmail({
        to: email,
        subject,
        html: htmlContent,
      });

      await db.insert(emailLogsTable).values({
        type: "password_reset",
        toEmail: email,
        subject,
        htmlContent,
        status: result.success ? "sent" : "failed",
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });
    } catch (error) {
      logger.error("Error in sendPasswordResetEmail", { error });
    }
  }
}
