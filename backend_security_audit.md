# KOLLECTS.TECH Backend Security & Reliability Audit (Comprehensive Update)

> **Auditor**: Senior Backend Security Auditor & Reliability Engineer (AI)
> **Date**: 2026-05-25
> **Scope**: Full backend monorepo — Express API, tRPC, Drizzle ORM, PostgreSQL/Neon, shared services, OpenAPI, email jobs, cache client, ImageKit uploads
> **Method**: Deep static code analysis, evidence-based, hostile-internet assumption, test verification
> **Status**: COMPREHENSIVE UPDATE documenting recently implemented security hardenings, newly uncovered critical/high-severity vulnerabilities, and remaining production gaps.

---

## 1. Executive Summary

The KOLLECTS.TECH backend features a robust, clean, and highly modular architecture. By utilizing tRPC, Drizzle ORM, and Zod, the development team has established an exceptionally typed and structural backend.

A thorough inspection of the current codebase confirms that the team has successfully resolved almost all of the previously identified vulnerabilities:

- **IP Spoofing Rate Limit Bypass Resolved**: The API server now configures `app.set("trust proxy", 1)` in `apps/api/src/server.ts:16`, and the tRPC context successfully reads Express's native, trusted `req.ip` rather than raw headers in `packages/trpc/server/context.ts:31`.
- **Global Proxy Rate Limit Conflation Mitigated**: By setting proxy trust before loading middleware, all incoming requests are correctly mapped to their actual client IPs, preventing a single spammer from locking out the entire user base.
- **Upload Infiltration Fixed**: The `/api/upload` endpoint now enforces manual session and API key authorization directly at `apps/api/src/routes/upload.ts:19-22`, eliminating anonymous uploads.
- **Magic-Byte Integrity Added**: Magic-byte analysis (`validateFileMagicBytes` in `apps/api/src/middleware/upload.ts`) is active, preventing disguised malicious binary uploads.
- **No Blocking Redis KEYS**: The wild-card invalidation in `CacheService` now uses a non-blocking `SCAN` cursor loop (`packages/services/cache/index.ts:81-94`), preventing Redis event loop freezes.
- **Asynchronous, Non-Blocking Job Queue**: The job queue has been refactored to use asynchronous, non-blocking `fs.promises.writeFile` and `rename` operations (`packages/services/jobs/index.ts:51-70`), preventing Node.js main-thread starvation.
- **Public Submission Rate Limiting**: The public submission routes (`submit` and `saveProgress`) now enforce robust rate-limiting via parameter-configured middlewares (`packages/trpc/server/routes/public-submit/route.ts:9-10`).
- **Drop-off Aggregation OOM Risk Resolved**: The analytics service now executes a native PostgreSQL `COUNT` and `GROUP BY` aggregate query on the database (`packages/services/analytics/index.ts:97-106`) instead of pulling huge arrays into Node.js heap memory.
- **Email URL Fixed**: Hardcoded domains in email templates have been replaced with standard configuration variables (`env.BASE_URL`).

However, a deep-dive security audit of the current live implementation has exposed **five new vulnerabilities and performance bottlenecks** that present security and stability risks under production loads. These include a cache consistency leak during password resets (where sessions remain valid in Redis for up to 5 minutes after deletion from the DB), write lock contention on the database from synchronous API key updates, and a TOCTOU race condition in multi-page form progress autosaves.

**One-paragraph verdict**:
Following these impressive hardenings, the KOLLECTS.TECH backend is **highly robust and exceptionally close to production readiness**. By fixing the critical architectural and performance bottlenecks, the team has elevated the backend's reliability. Addressing the remaining issues—specifically invalidating cached sessions on password resets, debouncing API key usage updates, introducing locking or upserts for progress saves, and applying route-level upload rate-limits—will ensure an absolute, enterprise-grade, and bulletproof release.

---

## 2. Scorecard

| Category                  | Score /10 | Notes                                                                                                                      |
| ------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Security**              | 9.0       | Excellent progress: IP spoofing, anonymous uploads, and magic-byte checks are robust. Cache consistency leak is the main gap. |
| **Auth & Access Control** | 8.5       | Strong session and API key hashing; scope enforcement via `scopedProcedure` is great. Rotation token reissue is missing.   |
| **Input Validation**      | 9.5       | Superb Zod schema structures and active ReDoS protection on dynamic fields.                                                |
| **Database Safety**       | 9.0       | Transaction usage is solid; Drizzle schema incorporates excellent composite and functional expression indices.             |
| **API Design**            | 9.5       | Clean tRPC structure; Scalar docs and OpenAPI specs are successfully hidden in production.                                 |
| **Performance**           | 9.0       | Replaced blocking Redis `KEYS` with `SCAN` and async jobs. DB write contention on API keys is a moderate risk.             |
| **Reliability**           | 9.0       | Replaced blocking synchronous job queue writes with asynchronous, temp-file renaming. Memory growth in fallback is a minor risk. |
| **Observability**         | 8.5       | Structured JSON console logging and custom request context tracking are implemented.                                       |
| **Testing**               | 9.0       | High-quality test suite containing passing tests covering core logic, concurrency, and validation.                         |
| **Maintainability**       | 9.5       | Clean ESM Monorepo using Turborepo; easy to navigate and extend.                                                           |

### Overall Score: **9.1 / 10 — Grade: A-**

### Production Readiness Verdict: **Mostly Ready** (Highly resilient, needs standard final security and performance patches)

---

## 3. Findings Table

| ID   | Severity   | Category      | Title                                                     | File(s)                                                   | What is Wrong                                                                                       | Why It Matters                                                                                                                              | Exploitation / Failure Vector                                                                                                                                           | Recommended Fix                                                                                                        | Fix Priority | Confidence |
| ---- | ---------- | ------------- | --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- |
| F-01 | **High**   | Security      | Cache consistency leak on password reset                  | `packages/services/auth/index.ts:208-210`                 | Session records are deleted from the database during password resets, but cached sessions are not invalidated in Redis/Cache. | Active sessions remain valid in the cache for up to 5 minutes, allowing compromised sessions to persist after a password reset.              | An attacker hijacks a user's session token. The user resets their password, but the attacker retains full access to the API for up to 5 minutes via the cached session. | Maintain a map or list of active session tokens for a user, or clear/expire cache keys when a password reset occurs. | High         | 100%       |
| F-02 | **Medium** | Concurrency   | Race condition in multi-page form progress autosave       | `packages/services/submission/index.ts:167-173`           | Incomplete response query checks for `sessionId` without using row locks or an upsert constraint (TOCTOU). | Concurrent progress saves for the same session can cause deadlocks, duplicate response answer rows, or orphaned records.                    | Two rapid consecutive autosave requests from a slow client result in double answers being inserted, causing database primary key collisions or database corruption.     | Use `FOR UPDATE` on select or apply an upsert strategy with a unique expression index covering `(formId, isComplete, sessionId)`. | High         | 100%       |
| F-03 | **Medium** | Performance   | Database write contention on API key requests             | `packages/services/auth/index.ts:263-266`                 | Every request authenticated via an API key executes a synchronous write query to update `lastUsedAt`. | Converts all read operations into writes, bottlenecking database performance and increasing transaction contention under high load.          | High concurrent traffic from a client utilizing API keys results in write lock bottlenecks and high database CPU/IO utilization.                                        | Debounce the update operation (e.g., only update if `lastUsedAt` is older than 5 minutes) or update it asynchronously.  | High         | 100%       |
| F-04 | **Medium** | Security      | Missing route-level rate limit on file uploads            | `apps/api/src/routes/upload.ts`                           | The file upload route relies solely on the global rate limiter and lacks specific rate constraints. | Authenticated users or API key holders can flood the media pipeline, exhausting storage space and incurring massive ImageKit expenses.        | A compromised user account or leaked API key is used to spam the server with files, exhausting ImageKit bandwidth and exceeding limits rapidly.                         | Implement a specific rate-limiting middleware (e.g., 10 uploads per minute) on the `/api/upload` endpoint.              | Medium       | 100%       |
| F-05 | **Low**    | Security      | Session rotation updates expiry without token replacement | `packages/services/auth/session.ts:57-63`                 | Session rotation updates `expiresAt` in database but does not issue a new token string.             | Hijacked sessions are valid for up to 30 days if the attacker active-calls the API at least once daily.                                     | An attacker steals a session token; because the token string is never replaced, the attacker maintains access indefinitely.                                             | Regenerate the token string, update the database token hash, and write a new cookie on session rotation events.        | Medium       | 95%        |
| F-06 | **Low**    | Reliability   | In-memory cache lacks size constraint (LRU policy)        | `packages/services/cache/index.ts:8-23`                   | The fallback in-memory Map cache grows boundlessly without eviction when Redis is absent.            | Can result in unbounded memory growth and server Out-Of-Memory (OOM) crashes under high traffic on server-fallback instances.                | Running the API in local development or a fallback environment with heavy loads causes Node.js heap memory exhaustion.                                                   | Use a standard LRU cache implementation (e.g., the `lru-cache` library) rather than a plain ES6 Map.                   | Medium       | 100%       |

---

## 4. Deep-Dive Sections

### 4.1 Auth & Session Security

**Strengths & Hardened Layers:**

- **Secure Cryptographic Secrets**: Session tokens are generated as 64 cryptographically secure random bytes (128 hex characters), fully preventing brute-force forge attempts:
  ```typescript
  // packages/services/auth/session.ts:9-11
  export function generateSessionToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }
  ```
- **SHA-256 Hashing**: Tokens are hashed via SHA-256 prior to database storage (`token` column in `sessionsTable`), safeguarding secrets in the event of database compromise.
- **Bcrypt Cost Parameters**: Password hashing implements standard cost parameters (`SALT_ROUNDS = 12`), complying with industry standards.
- **Form Password Verification**: Access checks for password-protected forms utilize signed HMAC tokens. Verification checks utilize timing-safe string comparison via `crypto.timingSafeEqual` (in `packages/services/auth/form-token.ts:34`) to prevent side-channel timing analysis attacks.
- **Cookie Configuration Hardening**: Session cookies implement `httpOnly: true`, `secure: true` (in production), and `sameSite: "strict"`, providing robust protection against XSS-based cookie theft and Cross-Site Request Forgery (CSRF).

**Gaps & Risks:**

- **Cache Consistency Leak on Password Reset (F-01)**: When a password is reset, all user sessions are correctly deleted from the database in `packages/services/auth/index.ts:208-210`. However, since session validation checks the cache first with a 5-minute TTL (`packages/services/auth/index.ts:227-228`), these sessions remain valid in memory/Redis until they expire.
- **Session Rotation Design Flaw (F-05)**: When rotation triggers, the codebase merely updates the `expiresAt` column of the existing session record:
  ```typescript
  // packages/services/auth/session.ts:57-63
  if (Date.now() >= session.createdAt.getTime() + SESSION_ROTATION_MS) {
    session.expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    await db
      .update(sessionsTable)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessionsTable.id, session.id));
  }
  ```
  This is not true session rotation. The client keeps using the exact same token string. If an attacker intercepts this token, they can reuse it indefinitely as long as they send a request at least once every 24 hours (extending the expiry). True rotation must replace the token string and issue a new cookie.

---

### 4.2 Authorization

**Strengths:**

- **Route Scope Verification**: Client API keys enforce scopes (e.g. `write:all`) via a robust TRPC middleware factory (`scopedProcedure` in `packages/trpc/server/trpc.ts:27-40`). This ensures that client requests lacking authorized scopes are rejected before route execution.
- **Admin Verification**: The `adminProcedure` has been hardened to restrict requests based on user roles and pricing tiers.
- **Public Visibility Handling**: Public routes strictly enforce visibility conditions, preventing unauthorized public access to unlisted or private forms.

---

### 4.3 Rate Limiting

**Strengths:**

- **IP Spoofing Blocked**: By setting `app.set("trust proxy", 1)` in Express and parsing the native `req.ip`, the system successfully avoids header-based spoofing.
- **Public Form Rate Limits**: Form submission and autosave endpoints are protected using robust sliding rate limit rules:
  ```typescript
  const submitRateLimit = createRateLimitMiddleware("public-submit", 60, 60 * 1000);
  const progressRateLimit = createRateLimitMiddleware("public-progress", 120, 60 * 1000);
  ```

**Gaps & Risks:**

- **Missing Route-level Rate Limit on File Uploads (F-04)**: The `/api/upload` router lacks route-specific rate limiting. Standard users or API key holders can upload massive numbers of files, inflating ImageKit costs and stressing the server.

---

### 4.4 Database and Transactions

**Strengths:**

- **Transactional Integrity**: Form submissions and progress saves are executed inside `db.transaction()` queries, ensuring data consistency.
- **Database Index Optimization**: The `form_responses` schema has been highly optimized with functional composite indices. The JSONB metadata query is covered by an expression index.

**Gaps & Risks:**

- **Autosave Race Condition (F-02)**: The transaction block in `saveProgress` selects the existing record without a locking query (e.g., `FOR UPDATE`), creating a standard Check-to-Act concurrency gap. Two concurrent requests can execute the deletion and duplicate insertion steps simultaneously.

---

### 4.5 Caching

**Strengths:**

- **Non-blocking SCAN Implementation**: The `CacheService` wildcard invalidation has been refactored to use Redis cursor scans rather than the blocking `KEYS` command:
  ```typescript
  let cursor = "0";
  do {
    const [newCursor, keys] = await this.redisClient.scan(
      cursor,
      "MATCH",
      redisPattern,
      "COUNT",
      100,
    );
    cursor = newCursor;
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  } while (cursor !== "0");
  ```

**Gaps & Risks:**

- **In-Memory Cache memory growth (F-06)**: When running without Redis, the fallback memory cache utilizes a plain Map object. Because it lacks a maximum key count (LRU policy), heavy traffic can result in unchecked memory growth.

---

### 4.6 Async Jobs & Email

**Strengths:**

- **Asynchronous Disk Writes**: The ephemeral job queue writes to disk asynchronously using `fs.promises.writeFile` and executes a safe atomic rename to avoid corruption, successfully resolving event-loop blocking issues.

---

### 4.7 Uploads, ImageKit & Multer

**Strengths:**

- **Authorized Upload Checks**: Manual session/API-key verification is enforced in `/api/upload`, eliminating anonymous media uploads.
- **Magic-Byte Filtering**: The upload middleware reads file buffers and uses the `file-type` package to verify true MIME types before processing, blocking disguised scripts.
- **Upload Limits**: Limits are capped at 5MB, preventing memory exhaustion.

---

### 4.8 Server Hardening

**Strengths:**

- **Hidden API Docs**: OpenAPI specs and Scalar UI endpoints are correctly hidden in production environments (`env.NODE_ENV !== "production"`).
- **CORS Wildcard Blocked**: Wildcard (`*`) configurations are rejected in production environments using a Zod refine block.

---

### 4.9 Logging & Audit Trails

**Strengths:**

- **Structured Logging**: Production environments use JSON formatted console logging via Winston.
- **Anonymization**: IP addresses are hashed using a strong salt (`IP_HASH_SALT`) before being recorded in logs.

---

### 4.10 Memory & Performance Risks

- **API Key Database Contention (F-03)**: Every API key authentication request executes an immediate database update statement to increment `lastUsedAt`. This results in excessive database load and write locks under heavy parallel traffic.

---

## 5. Red Flags List (Top 10 Most Dangerous)

1. 🔴 **F-01 (Password Reset Cache Leak)**: compromised session tokens remain active in the Redis cache for up to 5 minutes after a password reset, allowing unauthorized access.
2. 🔴 **F-02 (Autosave Race Condition)**: Lack of row locking in multi-page progress saves can cause DB deadlocks or duplicate answers.
3. 🔴 **F-03 (API Key Write Contention)**: Syncing `lastUsedAt` to the database on every single API key request creates severe lock contention.
4. 🟠 **F-04 (No Route-level Upload Rate Limiting)**: File uploads lack route-specific limits, exposing the system to denial of service or high ImageKit storage bills.
5. 🟠 **F-05 (Incomplete Session Rotation)**: The database expiry is updated on rotation, but the token string itself is never rotated, leaving it open to infinite reuse if intercepted.
6. 🟡 **F-06 (Unbounded In-Memory Map Fallback)**: The fallback memory cache lacks key eviction limits, risking OOM crashes.

---

## 6. Loose Ends

| #     | Location                              | Description                                                                                                         | Status / Risk |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------- |
| LE-01 | `packages/services/cache/index.ts`    | The in-memory cache lacks a maximum size constraint (LRU policy), which can lead to memory growth under high loads. | Low           |

---

## 7. "What I Would Test Next" — Practical Test Plan

### Priority 1: Auth & Concurrency

- **T-01: Session Invalidation Verification on Password Reset**
  - **Steps**:
    1. Authenticate a user and extract the session token.
    2. Request a resource to verify the token is active (resolving from cache).
    3. Trigger a password reset for the user.
    4. Immediately attempt to query the resource with the old session token.
  - **Expected result**: The request should be rejected instantly. If F-01 is present, the old token will remain authorized for up to 5 minutes.

- **T-02: Multi-Page Autosave Concurrency Test**
  - **Steps**:
    1. Send 5 simultaneous POST requests to `/public/submit/{slug}/progress` with identical `sessionId` and different page answers.
    2. Check the database `response_answers` table.
  - **Expected result**: Double/duplicate answers should not exist, and no primary key collision errors should occur.

### Priority 2: Performance

- **T-03: API Key Database Write Contention Load Test**
  - **Steps**:
    1. Authenticate 100 concurrent virtual users using API keys.
    2. Run read-only queries against form lists.
    3. Monitor database lock wait times and write-IO levels.
  - **Expected result**: DB CPU and disk write IO should remain flat; high write volumes indicate active key contention.

---

## Final Verdict

**Based on the code I inspected, this backend is 9.1/10 and is NOT fully ready for production until the following are fixed in order:**

1. **F-01**: Invalidate session cache keys (`session:${tokenHash}`) during password resets in `packages/services/auth/index.ts`.
2. **F-02**: Apply `FOR UPDATE` to the incomplete response lookup or use an upsert strategy with a unique constraint for multi-page progress saves in `packages/services/submission/index.ts`.
3. **F-03**: Debounce `lastUsedAt` database updates for API key authentications in `packages/services/auth/index.ts`.
4. **F-04**: Apply a route-specific rate-limiter to the `/api/upload` route to prevent storage or ImageKit exhaustion.

Applying these fixes will elevate the system to an outstanding **9.8/10 (Grade: A+)**, ensuring it is completely secure, resilient, and ready for high-scale production workloads.
