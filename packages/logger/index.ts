import winston from "winston";
import { env } from "./env";

type LoggerLevel = "error" | "info" | "debug";

const level: LoggerLevel = env.LOGGER_LEVEL ?? (env.NODE_ENV === "development" ? "debug" : "error");

const isDevelopment = env.NODE_ENV === "development";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "sessionToken",
  "apiKey",
  "secret",
  "authorization",
  "cookie",
  "jwt",
  "creditCard",
  "ssn",
  "SMTP_PASS",
  "IMAGEKIT_PRIVATE_KEY",
  "JWT_SECRET",
]);

function redactSensitive(obj: any, depth = 0): any {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSensitive(item, depth + 1));
  if (typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactSensitive(value, depth + 1);
      }
    }
    return result;
  }
  return obj;
}

const redactFormat = winston.format((info) => {
  const { message, level, timestamp, ...meta } = info;
  const redacted = redactSensitive(meta);
  return { message, level, timestamp, ...redacted };
});

const format = isDevelopment
  ? winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      redactFormat(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
        return `${timestamp} [${level}]: ${message}${metaString}`;
      }),
    )
  : winston.format.combine(winston.format.timestamp(), redactFormat(), winston.format.json());

export const logger = winston.createLogger({
  level: level,
  format: format,
  transports: [new winston.transports.Console()],
});
