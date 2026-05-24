import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_prod";

/**
 * Creates a short-lived (15 min) signed token for accessing password-protected forms.
 */
export function signFormPasswordToken(formId: string): string {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  const payload = `${formId}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verifies the signed form access token.
 */
export function verifyFormPasswordToken(token: string, expectedFormId: string): boolean {
  try {
    const [formId, expiresAtStr, signature] = token.split(".");
    if (formId !== expectedFormId) return false;
    if (Date.now() > parseInt(expiresAtStr, 10)) return false;
    
    const payload = `${formId}.${expiresAtStr}`;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
    
    // Timing safe comparison requires equal length buffers
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length) return false;
    
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
