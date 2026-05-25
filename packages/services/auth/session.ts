import crypto from "crypto";
import { db } from "@repo/database";
import { sessionsTable, SelectSession } from "@repo/database/models/session";
import { eq } from "drizzle-orm";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_ROTATION_MS = 24 * 60 * 60 * 1000; // 1 day

export function generateSessionToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  ipHash?: string,
  userAgent?: string,
): Promise<{ token: string; session: SelectSession }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  const [session] = await db
    .insert(sessionsTable)
    .values({
      userId,
      token: tokenHash,
      expiresAt,
      ipAddress: ipHash,
      userAgent,
    })
    .returning();

  return { token, session: session! };
}

export async function validateSession(tokenHash: string): Promise<SelectSession | null> {
  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, tokenHash))
    .limit(1);
  const session = sessionRows[0];

  if (!session) return null;

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
    return null;
  }

  // Rotate session if it's older than SESSION_ROTATION_MS (1 day)
  if (Date.now() >= session.createdAt.getTime() + SESSION_ROTATION_MS) {
    session.expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    await db
      .update(sessionsTable)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessionsTable.id, session.id));
  }

  return session;
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}
