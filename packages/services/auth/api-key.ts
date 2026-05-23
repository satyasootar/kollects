import { nanoid } from "nanoid";
import crypto from "crypto";

export function generateApiKey() {
  // Generate a 48-character base62 string (nanoid uses [A-Za-z0-9_~], we can just use default nanoid or restrict)
  const rawKey = nanoid(48);
  const keyPrefix = "sk_live_";
  const fullKey = `${keyPrefix}${rawKey}`;

  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  return { fullKey, keyHash, keyPrefix };
}

export function validateScope(userScopes: string[], requiredScope: string): boolean {
  if (userScopes.includes("*")) return true;
  return userScopes.includes(requiredScope);
}
