import { db } from "@repo/database";
import { usersTable, SelectUser } from "@repo/database/models/user";
import { passwordResetTokensTable } from "@repo/database/models/password-reset-token";
import { apiKeysTable } from "@repo/database/models/system";
import { sessionsTable } from "@repo/database/models/session";
import { auditLogsTable } from "@repo/database/models/system";
import { eq } from "drizzle-orm";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@repo/database/schemas/auth";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import { createSession, invalidateSession, validateSession } from "./session";
import { validateScope } from "./api-key";
import { hashIP } from "../ip";
import crypto from "crypto";
import { logger } from "@repo/logger";
import { cache } from "../cache";

export class AuthService {
  /**
   * Register a new user.
   */
  async register(
    data: z.infer<typeof registerSchema>,
    reqContext?: { ip?: string; userAgent?: string },
  ) {
    const validData = registerSchema.parse(data);

    // Check if user exists
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, validData.email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Email is already registered");
    }

    const hashedPassword = await hashPassword(validData.password);

    const [user] = await db
      .insert(usersTable)
      .values({
        name: validData.name,
        email: validData.email,
        passwordHash: hashedPassword,
      })
      .returning();

    if (!user) throw new Error("Failed to create user");

    logger.info("New user registered", { userId: user.id });

    // Create a session for the newly registered user
    const ipHash = reqContext?.ip ? hashIP(reqContext.ip) : undefined;
    const sessionResult = await createSession(user.id, ipHash, reqContext?.userAgent);

    return {
      user: this.sanitizeUser(user),
      token: sessionResult.token,
      session: sessionResult.session,
    };
  }

  /**
   * Log in an existing user.
   */
  async login(data: z.infer<typeof loginSchema>, reqContext?: { ip?: string; userAgent?: string }) {
    const validData = loginSchema.parse(data);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, validData.email))
      .limit(1);

    if (!user || !user.passwordHash) {
      logger.warn("Failed login attempt — user not found or no password", { userId: user?.id });
      throw new Error("Invalid email or password");
    }

    const isValid = await verifyPassword(validData.password, user.passwordHash);
    if (!isValid) {
      logger.warn("Failed login attempt — wrong password", { userId: user.id });
      throw new Error("Invalid email or password");
    }

    const ipHash = reqContext?.ip ? hashIP(reqContext.ip) : undefined;
    const sessionResult = await createSession(user.id, ipHash, reqContext?.userAgent);

    logger.info("User logged in successfully", { userId: user.id });

    // Audit log for login
    await db.insert(auditLogsTable).values({
      userId: user.id,
      action: "login",
      entityType: "user",
      entityId: user.id,
      ipAddress: reqContext?.ip || null,
    });

    return {
      user: this.sanitizeUser(user),
      token: sessionResult.token,
      session: sessionResult.session,
    };
  }

  /**
   * Log out a user by invalidating their session.
   */
  async logout(sessionId: string, sessionToken?: string) {
    if (sessionToken) {
      const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
      await cache.invalidate(`session:${tokenHash}`);
    }
    await invalidateSession(sessionId);
  }

  /**
   * Get the current user by ID.
   */
  async me(userId: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  }

  /**
   * Request a password reset email.
   */
  async forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
    const validData = forgotPasswordSchema.parse(data);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, validData.email))
      .limit(1);

    // To prevent email enumeration, we don't throw if user doesn't exist.
    if (!user) return;

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      token: tokenHash,
      expiresAt,
    });

    const { EmailService } = await import("../email");
    const emailService = new EmailService();
    await emailService.sendPasswordResetEmail(user.email, token);

    logger.info(`Password reset email queued`, { userId: user.id });
  }

  /**
   * Reset a password using a valid token.
   */
  async resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    const validData = resetPasswordSchema.parse(data);

    const tokenHash = crypto.createHash("sha256").update(validData.token).digest("hex");

    const [resetToken] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.token, tokenHash))
      .limit(1);

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    if (resetToken.usedAt) {
      throw new Error("Token has already been used");
    }

    if (Date.now() >= resetToken.expiresAt.getTime()) {
      throw new Error("Token has expired");
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validData.newPassword);

    // Update user
    await db
      .update(usersTable)
      .set({ passwordHash: newPasswordHash })
      .where(eq(usersTable.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, resetToken.id));

    // Invalidate all existing sessions for this user
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, resetToken.userId));

    // Audit log for password reset
    await db.insert(auditLogsTable).values({
      userId: resetToken.userId,
      action: "password_reset",
      entityType: "user",
      entityId: resetToken.userId,
    });
  }

  /**
   * Resolves a user from either a session token or an API key.
   */
  async resolveUser(options: { sessionToken?: string; apiKey?: string }) {
    if (options.sessionToken) {
      const tokenHash = crypto.createHash("sha256").update(options.sessionToken).digest("hex");
      const cacheKey = `session:${tokenHash}`;
      const cached = await cache.get<{ user: any; session: any }>(cacheKey);
      if (cached) return cached;

      const session = await validateSession(tokenHash);
      if (!session) return null;

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, session.userId))
        .limit(1);

      if (!user) return null;

      const result = { user: this.sanitizeUser(user), session };
      await cache.set(cacheKey, result, 300); // 5 minutes TTL
      return result;
    }

    if (options.apiKey) {
      const keyHash = crypto.createHash("sha256").update(options.apiKey).digest("hex");

      const [key] = await db
        .select()
        .from(apiKeysTable)
        .where(eq(apiKeysTable.keyHash, keyHash))
        .limit(1);

      if (!key || !key.isActive || (key.expiresAt && Date.now() > key.expiresAt.getTime())) {
        logger.warn("API key lookup failed — invalid or expired", {
          keyPrefix: options.apiKey.slice(0, 12),
        });
        return null;
      }

      // Update last used at
      await db
        .update(apiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeysTable.id, key.id));

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, key.userId))
        .limit(1);

      if (!user) return null;

      return { user: this.sanitizeUser(user), apiKey: key, scopes: key.scopes as string[] };
    }

    return null;
  }

  /**
   * Removes sensitive fields like password_hash from the user object.
   */
  private sanitizeUser(user: SelectUser): Omit<SelectUser, "passwordHash"> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
