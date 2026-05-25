# KOLLECTS.TECH Backend Security & Reliability Audit

> **Auditor**: Senior Backend Security Auditor (AI)
> **Date**: 2026-05-25
> **Scope**: Full backend monorepo — Express API, tRPC, Drizzle ORM, PostgreSQL/Neon, shared services, OpenAPI, email jobs, in-memory cache, ImageKit uploads
> **Method**: Static code analysis, evidence-based, hostile-internet assumption

---

## 1. Executive Summary

The KOLLECTS.TECH backend is a well-structured monorepo with clear separation of concerns, good schema design, and several security-conscious patterns already in place: passwords are hashed with bcrypt at cost 12, session tokens are stored as SHA-256 hashes, IP addresses are salted before hashing, and the tRPC procedure split between `publicProcedure` / `protectedProcedure` is clean and consistently applied. The overall architecture is sound for an MVP.

However, **five critical or high-severity issues require immediate resolution before production traffic**:
1. The file upload endpoint (`POST /api/upload`) has **zero authentication**, allowing any anonymous user to upload files to ImageKit at the platform's cost.
2. The form-access token (`form-token.ts`) uses a **hardcoded fallback secret** (`"fallback_secret_do_not_use_in_prod"`) with no validation that `JWT_SECRET` is set. In its current state this is the default in production unless the env var is explicitly set.
3. The rate-limit service has a **TOCTOU (check-then-act) race condition** — increment and check are two separate queries, allowing concurrent requests to bypass limits in bursts.
4. **API key scopes are never enforced at the route level** — `validateScope()` is imported but never called in any procedure, making all API key scopes decorative.
5. The in-memory `CacheService` is not shared across processes, so a multi-instance / horizontally scaled deployment will have **no cache consistency**, stale session caches, and rate-limit bypass (rate limits are DB-backed but session cache is in-memory only).

Beyond these, the codebase has a number of medium-severity issues including: no MIME-type or magic-byte validation on uploads, a password reset flow that lacks session invalidation, `adminProcedure` being functionally equivalent to `protectedProcedure`, no audit trail writes in application code despite having the schema, and full response sets loaded into memory for CSV export.

**One-paragraph verdict**: This backend demonstrates solid architectural thinking and defensible design patterns for a hackathon-stage product. The auth, access control, and validation layers are well-considered, and the rate-limiting approach using DB upserts is creative. However, the anonymous file upload endpoint, hardcoded fallback secret, non-enforced API key scopes, and in-memory-only cache all represent production-blocking gaps. With targeted fixes to these five issues, plus a handful of medium-priority hardening tasks, this backend can be considered production-viable for a limited user base.

---

## 2. Scorecard

| Category | Score /10 | Notes |
|---|---|---|
| **Security** | 6.5 | Hardcoded fallback secret, no upload auth, no MIME validation |
| **Auth & Access Control** | 7.0 | Good session/API key design; scopes never enforced |
| **Input Validation** | 7.5 | Dynamic Zod schema is solid; visibility not checked in resolvePublicForm |
| **Database Safety** | 7.0 | Good use of transactions; rate-limit TOCTOU; no form-limit enforcement |
| **API Design** | 7.5 | Clean tRPC + OpenAPI; z.any() outputs leak schema; docs exposed in prod |
| **Performance** | 6.0 | In-memory cache not scalable; CSV loads all rows; analytics N+1 |
| **Reliability** | 5.5 | Job queue lost on restart; no retry; no persistence |
| **Observability** | 6.5 | Good request IDs and logging; audit logs never written; no metrics |
| **Testing** | 6.0 | 87 tests pass; MIME validation test commented out; no migration tests |
| **Maintainability** | 7.5 | Clean monorepo; several TODOs are blockers in prod |

### Overall: **6.7 / 10 — Grade: C+**
### Production Readiness: **Needs Hardening**

---

## 3. Findings Table

| ID | Severity | Category | Title | File(s) | Evidence |
|---|---|---|---|---|---|
| F-01 | **Critical** | Auth | Anonymous file upload — zero auth on upload endpoint | `apps/api/src/routes/upload.ts` | Route has no auth middleware; any anonymous caller can upload to ImageKit |
| F-02 | **Critical** | Auth | Hardcoded fallback JWT secret for form tokens | `packages/services/auth/form-token.ts:3` | `const JWT_SECRET = process.env.JWT_SECRET \|\| "fallback_secret_do_not_use_in_prod"` |
| F-03 | **High** | Rate Limiting | TOCTOU race condition in rate limit check | `packages/services/rate-limit/index.ts:19-48` | INSERT+UPDATE then separate SELECT — concurrent requests can both pass before count is read |
| F-04 | **High** | Auth | API key scopes defined but never enforced | `packages/trpc/server/middleware/auth.ts`, all routers | `validateScope` imported but never called in any procedure or middleware |
| F-05 | **High** | Auth | Reset password does not invalidate existing sessions | `packages/services/auth/index.ts:199` | Comment: "Optional: Invalidate all existing sessions here" — left unimplemented |
| F-06 | **High** | Uploads | No MIME-type or magic-byte validation on uploads | `apps/api/src/middleware/upload.ts`, `apps/api/src/routes/upload.ts` | Multer has no `fileFilter`; any binary content accepted by extension alone |
| F-07 | **High** | Reliability | In-memory job queue lost on process restart | `packages/services/jobs/index.ts` | Queue is a plain JS array; any pending jobs at shutdown are permanently lost |
| F-08 | **Medium** | Auth | Cookie maxAge (7 days) mismatches session lifetime (30 days) | `packages/trpc/server/utils/cookies.ts:21`, `packages/services/auth/session.ts:6` | Cookie expires before DB session; re-auth required unnecessarily |
| F-09 | **Medium** | Auth | Admin procedure has no admin check | `packages/trpc/server/trpc.ts:28-33` | `adminProcedure` middleware is a no-op; any authenticated user can call admin routes |
| F-10 | **Medium** | Input Validation | `recordStart` accepts any UUID without verifying form exists or is published | `packages/trpc/server/routes/public-submit/route.ts:55-64` | Arbitrary UUIDs can spam `totalStarts` increment on deleted/draft forms |
| F-11 | **Medium** | Business Logic | Form limit enforcement is hardcoded to 0 (permanently disabled) | `packages/services/form/index.ts:59` | `const currentFormsCount = 0; // STUB` — users can create unlimited forms |
| F-12 | **Medium** | Database | CSV export loads all responses into memory with no limit | `packages/services/response/index.ts:125-133` | No `limit` on `findMany` for export — a form with 100k responses OOMs the server |
| F-13 | **Medium** | Cache | In-memory cache is not shared across processes | `packages/services/cache/index.ts` | Multi-instance deployment causes stale session caches and blind rate-limit bypass |
| F-14 | **Medium** | Observability | `auditLogsTable` schema exists but is never written to in application code | `packages/database/models/system.ts:49` | Grep confirms zero `insert(auditLogsTable)` calls outside test files |
| F-15 | **Medium** | Uploads | Upload route error leaks `error.message` directly | `apps/api/src/routes/upload.ts:26` | `res.status(500).json({ error: error.message })` — ImageKit SDK errors may contain internal details |
| F-16 | **Medium** | Security | `access-control.ts:resolvePublicForm` does not enforce `visibility` field | `packages/services/form/access-control.ts:33-59` | Comment says "visibility" checked, but only `status` and `passwordHash` are actually checked |
| F-17 | **Medium** | Performance | Analytics field stats loads ALL completed response IDs then fetches answers — N+1 risk | `packages/services/analytics/index.ts:138-156` | `inArray` with potentially thousands of IDs; should use a JOIN |
| F-18 | **Medium** | Security | OpenAPI docs and Scalar UI are exposed in production with no auth | `apps/api/src/server.ts:42-47` | `/openapi.json` and `/docs` unconditionally available — exposes full API schema publicly |
| F-19 | **Medium** | Auth | `resolveUser` caches full session result including user data at token key | `packages/services/auth/index.ts:207-224` | Cache key is the raw session token string — if token leaks, cache lookup also works |
| F-20 | **Medium** | Rate Limiting | Password reset endpoint has no rate limiting | `packages/trpc/server/routes/auth/route.ts:112` | `resetPassword` uses `publicProcedure` with no rate-limit middleware attached |
| F-21 | **Low** | Input Validation | Email template rendering uses user-controlled data without HTML-escaping | `packages/services/email/templates.ts:48-49` | Field labels and answers inserted directly into HTML — stored XSS in email body |
| F-22 | **Low** | Input Validation | Custom regex from DB passed directly to `new RegExp()` | `packages/services/submission/dynamic-validator.ts:21` | Malicious form creator could store ReDoS payload in `validations.pattern` |
| F-23 | **Low** | Session | Session rotation only extends expiry but does not issue a new token | `packages/services/auth/session.ts:50-53` | True rotation should replace the token to limit credential replay window |
| F-24 | **Low** | Business Logic | Slug availability check has a TOCTOU — race between check and insert | `packages/services/slug/index.ts:90-106` | DB unique constraint prevents corrupt data but creates unhandled exception at high concurrency |
| F-25 | **Low** | Logging | Failed login log at line 90 includes `user.email` | `packages/services/auth/index.ts:90` | Email is PII; failed-login logs that include email could violate GDPR Article 32 |
| F-26 | **Low** | Logging | Email content (HTML body) written to `emailLogsTable` | `packages/services/email/index.ts:75` | Sensitive user-answer data stored in email log table long-term with no TTL/cleanup |
| F-27 | **Informational** | API Design | Many procedures output `z.any()` — no output schema validation | Multiple routers | Breaks OpenAPI contract generation and allows schema drift without detection |
| F-28 | **Informational** | Security | Default `CORS_ORIGINS` is `"*"` in env schema | `apps/api/src/env.ts:7` | If `CORS_ORIGINS` env var is not set in production, CORS is wide open |
| F-29 | **Informational** | Testing | Upload MIME-type test is commented out | `apps/api/src/routes/__tests__/upload.test.ts:67` | Test acknowledges the gap but leaves the assertion disabled |
| F-30 | **Informational** | Testing | No migration tests exist | Entire test suite | No tests verify migration sequence or schema rollback safety |

---

## 4. Deep-Dive Sections

### 4.1 Auth & Session Security

**Strengths:**
- Session tokens are 64 random bytes (128 hex chars) — computationally unforgeable.
- Tokens stored as SHA-256 hashes in the DB — plaintext is never persisted.
- Passwords use bcrypt with cost factor 12 — appropriate and safe.
- IP addresses are salted before hashing — privacy-conscious.
- The `sanitizeUser()` method ensures `passwordHash` is never returned in any response.
- Cookie flags are correctly set: `httpOnly: true`, `secure: true` in prod, `sameSite: strict`.

**Issues:**

**F-02 (Critical) — Hardcoded JWT secret:**
```ts
// form-token.ts:3
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_prod";
```
If `JWT_SECRET` is not set in environment, any attacker who reads the source code (e.g. via a GitHub repo) can forge valid form-access tokens for any `formId`. The env schema in `packages/services/env.ts` does not include `JWT_SECRET`, so there is no startup-time validation. Fix: add `JWT_SECRET: z.string().min(32)` to the env schema.

**F-08 (Medium) — Cookie/Session lifetime mismatch:**
The session cookie has `maxAge: 7 days` but the DB session lifetime is `30 days`. This means users are forced to re-authenticate after 7 days even though the DB session is still valid. The cookie maxAge should match the session lifetime, or be intentionally shorter with explicit documentation.

**F-23 (Low) — Session rotation doesn't replace token:**
```ts
// session.ts:50-53
if (Date.now() >= session.createdAt.getTime() + SESSION_ROTATION_MS) {
  session.expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await db.update(sessionsTable).set({ expiresAt: session.expiresAt })...
```
True session rotation invalidates the old token and issues a new one. The current implementation only extends the expiry — it does not create a new token. An old token intercepted from a log or network is valid indefinitely as long as the session isn't explicitly logged out.

**F-05 (High) — Password reset does not invalidate sessions:**
```ts
// auth/index.ts:199
// Optional: Invalidate all existing sessions here if we had a direct user_id reference utility
```
After a password reset, all existing sessions should be immediately invalidated. An attacker who has compromised an account and is actively using it will remain logged in after the victim resets their password. Fix: `DELETE FROM sessions WHERE userId = resetToken.userId`.

**F-19 (Medium) — Session cache key is the raw token:**
```ts
const cacheKey = `session:${options.sessionToken}`;
```
The token is a secret. Using it as a cache key means it appears in logs, metrics dashboards, or any cache key dump. Consider hashing the token before using it as the cache key: `session:${sha256(token)}`.

---

### 4.2 Authorization

**Strengths:**
- `protectedProcedure` consistently wraps all sensitive routes — no unguarded protected endpoints found.
- `assertOwnership()` is consistently called in `FormService`, `ResponseService`, `AnalyticsService`.
- Public form access correctly checks `status !== "published"` and `deletedAt`.
- The explore feed correctly enforces `visibility = 'public'` AND `status = 'published'` AND `deletedAt IS NULL`.

**Issues:**

**F-04 (High) — API key scopes never enforced:**
```ts
// auth/api-key.ts:15
export function validateScope(userScopes: string[], requiredScope: string): boolean {...}

// auth/index.ts:15
import { validateScope } from "./api-key"; // imported but never called
```
API keys have scopes (`read:all`, `write:all`, custom) stored in DB. The `apiKeyScopes` are placed in context. But `validateScope()` is never called in any router or middleware. Any valid API key — even one intended to be read-only — can mutate data freely. Fix: Create a `scopedProcedure` middleware factory and apply it to write mutations.

**F-09 (Medium) — `adminProcedure` is a no-op:**
```ts
// trpc.ts:28-33
export const adminProcedure = protectedProcedure.use(
  middleware(async ({ ctx, next }) => {
    // Future: check ctx.user.plan === "enterprise" or a dedicated admin flag
    return next(); // Always proceeds!
  })
);
```
Any authenticated user can call admin procedures. Since this is unused for now the blast radius is limited, but it's a time bomb if admin routes are added before this is fixed.

**F-16 (Medium) — `resolvePublicForm` does not check `visibility`:**
```ts
// access-control.ts:33-59
// Comment: "Validates public access to a form, enforcing visibility, status, and password checks."
// Reality: only checks status and passwordHash
```
The `visibility` field (`public` / `unlisted`) is referenced in the comment but not validated. An `unlisted` form should not appear in the explore feed (the explore router correctly filters), but a direct slug access to an unlisted form goes through `resolvePublicForm` which will serve it without restriction. This may or may not be the intended behavior, but the comment is misleading and the business logic is ambiguous.

**F-10 (Medium) — `recordStart` accepts arbitrary UUIDs:**
```ts
// public-submit/route.ts:55-64
recordStart: publicProcedure
  .input(z.object({ formId: z.string().uuid() }))
  .mutation(async ({ input }) => {
    await analyticsService.recordStart(input.formId); // No ownership/existence check
  }),
```
Any external caller can send a UUID to inflate `totalStarts` on any form, corrupting analytics.

---

### 4.3 Rate Limiting

**Strengths:**
- Rate limits are DB-backed (PostgreSQL) which survives process restarts.
- The window-based approach using upsert is idiomatic.
- Auth endpoints (login, register, forgot-password) all have rate limits applied.
- IP hashing provides privacy while enabling effective rate limiting.

**Issues:**

**F-03 (High) — TOCTOU race condition:**
```ts
// rate-limit/index.ts:19-48
await db.insert(...).onConflictDoUpdate({ set: { count: sql`count + 1` } }); // Step 1
const [entry] = await db.select(...).where(...); // Step 2
if (entry && entry.count > limit) { throw ... } // Step 3
```
Steps 1 and 2 are separate queries. Under concurrency, 20 requests can all execute Step 1 concurrently (all increment), then all read the same value in Step 2, and either all pass or all fail. The correct pattern is to read the post-increment count from the RETURNING clause of the upsert. The upsert already uses `sql\`count + 1\`` which is atomic; it should RETURN that count and check it immediately.

```ts
// Fix:
.onConflictDoUpdate({...})
.returning({ count: rateLimitEntriesTable.count })
// Then check returned count directly
```

**F-20 (Medium) — `resetPassword` has no rate limit:**
```ts
// auth/route.ts:112
resetPassword: publicProcedure  // No .use(someRateLimit)
  .mutation(async ({ input }) => { await authService.resetPassword(input); })
```
An attacker with a leaked reset token can attempt to guess/brute-force password validation if there were any timing side channels. More critically, if the token isn't properly used-once (see F-05), there's a window for repeated use.

---

### 4.4 Database and Transactions

**Strengths:**
- Form creation, clone, and response submission all use `db.transaction()`.
- Atomic SQL increments (`sql\`count + 1\``) used correctly for counters.
- ON DELETE CASCADE is defined on foreign keys.
- Unique indexes on slug, API key hash, and rate limit entries.

**Issues:**

**F-11 (Medium) — Form limit is hardcoded to 0:**
```ts
// form/index.ts:59
const currentFormsCount = 0; // STUB
if (currentFormsCount >= user.formLimit) { // Never triggers
```
The user's plan-based form limit is fetched from the DB but the actual count is never queried. Users on the `free` plan (limit: 5) can create unlimited forms.

**F-12 (Medium) — CSV export unbounded:**
```ts
// response/index.ts:125-133
const responses = await db.query.formResponsesTable.findMany({
  where: and(eq(...formId), eq(...isComplete, true)),
  with: { answers: true }, // NO LIMIT
```
A form with 100,000 responses will load all of them (with all their answers) into a single Node.js object. This will exhaust heap memory and crash the process.

**F-17 (Medium) — N+1 in field stats:**
```ts
// analytics/index.ts:138-156
const completedResponses = await db.select({ id }).from(...).where(...)
const responseIds = completedResponses.map(r => r.id); // Could be thousands
const answers = await db.query.responseAnswersTable.findMany({
  where: and(eq(fieldId), inArray(responseId, responseIds)) // Large IN clause
```
For a popular form, `responseIds` could be thousands. PostgreSQL `IN (...)` with thousands of values is inefficient. Use a subquery or JOIN instead.

**F-24 (Low) — Slug TOCTOU:**
```ts
// slug/index.ts:90-106
const isAvailable = await this.checkAvailability(baseSlug);
if (isAvailable) return baseSlug; // Race: another request could take this slug between check and insert
```
The DB unique constraint on `slug` will prevent corruption, but will throw an unhandled exception that propagates to the user as a 500 error rather than a clean conflict message.

---

### 4.5 Caching

**Strengths:**
- Cache invalidation is called after form updates, deletes, publish, unpublish, archive.
- TTLs are set (60s for public forms, 300s for session/analytics).

**Issues:**

**F-13 (Medium) — In-memory cache not process-safe:**
```ts
// cache/index.ts:2
private cache: Map<string, { value: any; expiry: number }>;
```
This is a plain `Map`. Each Node.js process has its own isolated copy. In a clustered or multi-instance deployment:
- Session cache will have inconsistent hits across nodes.
- Invalidating a cache key on one node does not affect other nodes.
- This can serve stale public form data after updates.

The fix is to replace with Redis, Valkey, or at minimum use the existing structure but document it as single-instance only.

**F-19 (Medium) — Cache key exposes session token:**
The session token itself is used as the cache key string. Any cache inspection tool or log that dumps cache keys will reveal active session tokens.

---

### 4.6 Async Jobs & Email

**Issues:**

**F-07 (High) — Job queue lost on restart:**
```ts
// jobs/index.ts:25
private queue: { type: string; payload: any }[] = [];
```
This is a plain in-memory array. When the process restarts (deployment, crash, OOM kill), all pending jobs are lost silently. Email notifications for submissions that happened seconds before a restart will never be sent. No retry, no dead-letter queue, no persistence.

Additionally, `processNext()` schedules itself with `setTimeout(() => this.processNext(), 0)` which creates a tight loop. If the queue is empty, the `running = false` branch stops the loop. When a new job is enqueued and `processNext()` is called again, this could create a dangling `setTimeout` if `enqueue` is called while `processNext()` is already running (the `!this.running` guard helps but the timing between `queue.length === 0` and the `processNext()` restart is a race).

**F-21 (Low) — Stored XSS in email templates:**
```ts
// email/templates.ts:48-49
html += `<td>${field.label}</td>`;
html += `<td>${displayValue || "-"}</td>`;
```
`field.label` comes from user-created form configuration and `displayValue` from user-submitted answers. Neither is HTML-escaped before insertion into the email HTML body. A malicious form creator can craft labels with `<script>` or `<img onerror="...">` which will execute in email clients that render HTML. Fix: escape HTML entities in both.

**Duplicate email prevention**: There is no idempotency key or deduplication mechanism. If `submit()` enqueues a job and the job runs twice (e.g., due to a bug), the respondent receives duplicate emails.

---

### 4.7 Uploads, ImageKit & Multer

**F-01 (Critical) — Anonymous upload:**
```ts
// apps/api/src/routes/upload.ts:8
router.post("/", upload.single("file"), async (req, res) => {
// No authentication middleware applied
```
This endpoint is mounted at `/api/upload` in `server.ts` before the tRPC middleware. There is no session cookie check, no API key check, no middleware at all. Any anonymous HTTP client can upload arbitrary files to ImageKit using the platform's credentials and quota.

**F-06 (High) — No MIME-type or magic-byte validation:**
```ts
// middleware/upload.ts
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
  // No fileFilter
});
```
Multer will accept any file type. An attacker can upload a PHP script named `avatar.jpg`. ImageKit will store it, potentially serving it as a file. Additionally, the `Content-Type` header is client-controlled and should not be trusted. Fix: add `fileFilter` using a magic-byte library like `file-type`.

The upload test file acknowledges this gap but comments out the assertion:
```ts
// upload.test.ts:67
// expect(responseMalicious.status).toBe(400);
```

---

### 4.8 Server Hardening

**Strengths:**
- Security headers middleware is applied globally: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Content-Security-Policy`, `HSTS`.
- Body size limited to 1MB.
- CORS is restrictive in production (allowlist-based).

**Issues:**

**F-18 (Medium) — OpenAPI docs exposed in production:**
```ts
// server.ts:42-47
app.get("/openapi.json", (req, res) => res.json(openApiDocument));
app.use("/docs", apiReference({ url: "/openapi.json" }));
```
Both routes are unconditional. In production, the full API schema — all endpoints, parameter names, response shapes — is publicly readable at `/openapi.json`. While not a direct exploit, it significantly lowers the bar for attackers to craft targeted attacks.

**F-28 (Informational) — Default CORS origin is `*`:**
```ts
// apps/api/src/env.ts:7
CORS_ORIGINS: z.string().optional().default("*"),
```
If the `CORS_ORIGINS` environment variable is not explicitly set in production, all origins are allowed, defeating the allowlist logic in the CORS middleware.

**F-15 (Medium) — Upload error leaks internal messages:**
```ts
// upload.ts:26
return res.status(500).json({ error: error.message || "Failed to upload file" });
```
ImageKit SDK errors include API endpoint details, internal error codes, and potentially account information. These should be sanitized to a generic message.

---

### 4.9 Logging & Audit Trails

**Strengths:**
- Winston logger with structured JSON output in production.
- Request IDs on every log entry via `ctx.requestMeta.requestId`.
- Sensitive keys (`password`, `token`, `key`, `secret`, `hash`) are redacted in logging middleware.
- Timing middleware logs request duration.

**Issues:**

**F-14 (Medium) — Audit log table exists but is never written:**
The `auditLogsTable` schema is defined with fields for `userId`, `action`, `entityType`, `entityId`. But searching the entire codebase reveals zero `insert(auditLogsTable)` calls in production code. The table exists only as a placeholder. For a form platform, security-sensitive events (login, key creation/revocation, form deletion, password reset) should all produce audit records.

**F-25 (Low) — Failed login logs include email:**
```ts
// auth/index.ts:90
logger.warn("Failed login attempt — wrong password", { userId: user.id, email: user.email });
```
Logging the email address on a failed attempt creates a privacy risk under GDPR — a log dump of failed authentication attempts becomes a PII database.

**F-26 (Low) — Email HTML body stored in emailLogsTable:**
The full HTML email content (which contains user-submitted form answers) is stored in `emailLogsTable.htmlContent`. This creates a secondary copy of user PII with no described TTL or cleanup policy.

---

### 4.10 Memory & Performance Risks

**F-12 (Medium) — CSV export OOM risk** (detailed above)

**F-17 (Medium) — Analytics IN() clause** (detailed above)

**Cache growth:** The in-memory cache has no maximum size. Under sustained load, caching every session (`session:{token}`) and every public form query creates unbounded memory growth. The `purgeExpired()` method exists but is never called on a schedule. Fix: call `cache.purgeExpired()` in a cron task.

**Job queue tight loop:** `processNext()` uses `setTimeout(() => this.processNext(), 0)` to yield to the event loop, but this means a queue with 10,000 jobs has 10,000 `setTimeout` calls scheduled. Under high submission load this could delay other I/O. A production queue should use a back-pressure mechanism.

**`getPublicBySlug` caches the full form including `passwordHash`:**
```ts
// form/index.ts:280
await cache.set(cacheKey, form, 60); // full form including passwordHash
```
The bcrypt hash of the form password is cached in memory. While not directly exploitable, it's unnecessary data in the cache and follows the principle of least privilege.

---

## 5. Red Flags List (Top 10 Most Dangerous)

1. 🔴 **F-01**: Anonymous file upload — anyone can drain your ImageKit quota
2. 🔴 **F-02**: Hardcoded JWT fallback secret — anyone who reads the source can forge form-access tokens
3. 🔴 **F-03**: Rate-limit TOCTOU — concurrent requests can bypass login/register limits in bursts
4. 🔴 **F-04**: API key scopes never enforced — all API keys have full access regardless of configured scope
5. 🔴 **F-05**: Password reset doesn't invalidate sessions — active attacker stays in after victim resets
6. 🟠 **F-06**: No MIME-type validation on uploads — malicious file types can be uploaded
7. 🟠 **F-07**: In-memory job queue lost on restart — email notifications silently dropped
8. 🟠 **F-11**: Form limit is permanently disabled — business model enforcement broken
9. 🟠 **F-12**: Unbounded CSV export — a large form can OOM the server in production
10. 🟠 **F-16**: `resolvePublicForm` doesn't enforce `visibility` — behavior is ambiguous and misleading

---

## 6. Loose Ends

| # | Location | Issue |
|---|---|---|
| LE-01 | `packages/services/form/index.ts:58-59` | `TODO (Phase 13): Actually count current forms and enforce formLimit` — still a STUB with hardcoded 0 |
| LE-02 | `packages/trpc/server/trpc.ts:26-33` | `adminProcedure` has a TODO for admin check — currently identical to `protectedProcedure` |
| LE-03 | `packages/services/auth/index.ts:199` | Comment: "Optional: Invalidate all existing sessions here..." — left unimplemented |
| LE-04 | `packages/services/email/index.ts:160` | Password reset link hardcodes `https://kollects.tech` — should use a `BASE_URL` env var |
| LE-05 | `apps/api/src/routes/upload.ts:30` | Comment: `// ... [we'll append the error handler before export]` — incomplete remark left in production code |
| LE-06 | `packages/services/auth/form-token.ts:3` | `JWT_SECRET` not in env schema — not validated at startup |
| LE-07 | `packages/services/form/index.ts:261` | Comment says "resolving visibility rules" but `resolvePublicForm` never checks `visibility` |
| LE-08 | `packages/trpc/server/routes/public-form/route.ts:22` | `require()` used inside async function for dynamic import — inconsistent with ESM style |
| LE-09 | `packages/database/models/system.ts:49` | `auditLogsTable` schema defined but never written to in production code |
| LE-10 | `apps/api/src/routes/__tests__/upload.test.ts:67` | MIME-type validation test assertion is commented out with a TODO comment |
| LE-11 | `packages/services/cache/index.ts` | `purgeExpired()` defined but never called on any cron schedule |
| LE-12 | Form settings `(form.settings as any)?.successMessage` | Type-unsafe JSON access — should define settings schema |

---

## 7. "What I Would Test Next" — Practical Security Test Plan

### Priority 1: Critical Security Verification

**T-01: Anonymous Upload Attack**
```bash
# Should return 401 — currently returns 200
curl -X POST http://localhost:8000/api/upload \
  -F "file=@/path/to/test.jpg"
```
Expected: `401 Unauthorized`. Actual: `200 OK` — **confirmed bug F-01**.

**T-02: Forged Form Token**
```js
// Use the hardcoded secret to forge a valid token
const crypto = require('crypto');
const JWT_SECRET = "fallback_secret_do_not_use_in_prod";
const formId = "<any-form-uuid>";
const expiresAt = Date.now() + 999999999;
const payload = `${formId}.${expiresAt}`;
const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
const token = `${payload}.${sig}`;
// Use token to bypass form password protection
```

**T-03: Rate Limit Bypass Under Concurrency**
```js
// Fire 15 login requests simultaneously (limit is 10)
const promises = Array.from({ length: 15 }, () => 
  fetch('/api/authentication/login', { method: 'POST', body: JSON.stringify({email:'x@x.com',password:'wrong'}) })
);
const results = await Promise.all(promises);
// Count how many return 200 vs 429
// Expected: ≤10 succeed. Currently likely all 15 proceed.
```

### Priority 2: Authorization Testing

**T-04: API Key Scope Bypass**
```bash
# Create a read-only API key
# Then attempt a write operation
curl -H "Authorization: Bearer sk_live_<read-only-key>" \
     -X DELETE http://localhost:8000/api/responses/<response-id>
# Expected: 403 Forbidden. Actual: succeeds — confirms F-04
```

**T-05: Session Persistence After Password Reset**
```
1. Login as user A → get session token S1
2. Initiate password reset flow
3. Complete password reset
4. Attempt API call with session token S1
5. Expected: 401 Unauthorized. Actual: succeeds — confirms F-05
```

**T-06: recordStart Analytics Inflation**
```bash
curl -X POST http://localhost:8000/api/public/submit/<any-uuid>/start \
  -H "Content-Type: application/json" \
  -d '{"formId":"00000000-0000-0000-0000-000000000001"}'
# Should 404 for non-existent form. Currently increments totalStarts on any UUID.
```

### Priority 3: Upload Security Testing

**T-07: MIME-Type Bypass**
```bash
# Upload a PHP script disguised as an image
curl -X POST http://localhost:8000/api/upload \  # Will need auth after F-01 fix
  -F "file=@exploit.php;type=image/jpeg"
# Expected: 400 Bad Request (MIME validation). Currently: accepted
```

**T-08: Oversized Upload**
```bash
dd if=/dev/urandom of=large.bin bs=1M count=6
curl -X POST http://localhost:8000/api/upload -F "file=@large.bin"
# Expected: 413 Payload Too Large — this one works correctly
```

### Priority 4: Performance Stress Tests

**T-09: CSV Export OOM**
```
1. Create a form with 50+ fields
2. Submit 10,000 responses (use a script)
3. Call GET /api/responses/<formId>/export
4. Monitor Node.js heap usage
# Expected: streamed or paginated. Actual: full load into memory — OOM risk
```

**T-10: Cache Growth Under Load**
```
1. Make 10,000 unique GET /public/forms/<slug> requests over 60 seconds
2. Monitor process memory growth
3. Note that without purgeExpired() being called, entries accumulate
```

---

## Final Verdict

**Based on the code I inspected, this backend is 6.7/10 and is NOT ready for production until the following are fixed in order:**
1. **F-01** — Add authentication middleware to the upload endpoint
2. **F-02** — Add `JWT_SECRET` to env schema validation (fail at startup if missing)
3. **F-03** — Fix rate-limit check to use RETURNING clause count instead of a second SELECT
4. **F-04** — Implement scope enforcement middleware and apply to write procedures
5. **F-05** — Delete all user sessions after a password reset completes
6. **F-06** — Add `fileFilter` with magic-byte validation to Multer
7. **F-07** — Document that job queue is MVP only; do not accept production traffic without persistent queue

With those seven fixes applied, the backend would move to ~7.8/10 and be viable for a limited-user production launch. The remaining medium items (CSV streaming, form limit enforcement, admin procedure, visibility enforcement) should follow in the next iteration.
