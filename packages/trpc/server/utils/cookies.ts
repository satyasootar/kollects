import type { Response } from "express";

const IS_PROD =
  String(process.env.NODE_ENV) === "production" || String(process.env.NODE_ENV) === "prod";

/**
 * Sets an HTTP-Only secure cookie for the session token.
 *
 * Cookie settings:
 * - `httpOnly`: true (JavaScript cannot access the cookie)
 * - `secure`: true in production (requires HTTPS)
 * - `sameSite`: "strict" (CSRF protection)
 * - `path`: "/" (available across the whole site)
 * - `maxAge`: 7 days in milliseconds
 */
export function setSessionCookie(res: Response, token: string) {
  res.cookie("session", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(res: Response) {
  res.clearCookie("session", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/",
  });
}
