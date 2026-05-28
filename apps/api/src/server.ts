import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

import { jobQueue } from "@repo/services/jobs";

export const app = express();
app.set("trust proxy", 1); // Trust first-hop reverse proxy (Cloudflare, Nginx, Load Balancer)

import { corsMiddleware } from "./middleware/cors";
import { securityHeaders } from "./middleware/security-headers";

app.use(securityHeaders);
app.use(corsMiddleware);

import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
});

app.use(apiLimiter);
app.use(express.json({ limit: "500kb" }));



app.get("/", (req, res) => {
  return res.json({ message: "KOLLECTS.TECH is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "KOLLECTS.TECH server is healthy", healthy: true });
});



if (env.NODE_ENV !== "production") {
  const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "KOLLECTS.TECH API",
    version: "1.0.0",
    description: `# KOLLECTS.TECH — Form Builder & Analytics Platform API

## Overview
KOLLECTS.TECH is a full-featured form builder platform that allows users to create dynamic forms, collect responses, and analyze submission data. This API powers the entire platform including authentication, form management, public form rendering, response collection, analytics, and media uploads.

## Authentication
The API supports two authentication methods:

### 1. Session Cookie (Browser Clients)
- Call \`POST /api/authentication/register\` or \`POST /api/authentication/login\`
- A secure \`session\` cookie is automatically set (HttpOnly, Secure, SameSite=Strict)
- All subsequent requests are authenticated via this cookie
- Sessions last 30 days and auto-rotate daily

### 2. API Key (Programmatic Access)
- Create an API key via \`POST /api/api-keys\` (requires session auth first)
- Pass the key as \`Authorization: Bearer sk_live_...\` header
- API keys have configurable scopes: \`read:all\`, \`write:all\`
- Keys can be revoked at any time

## Rate Limiting
All endpoints are rate-limited. Limits vary by endpoint:
| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 1000 req | 15 min |
| Login | 10 req | 15 min |
| Register | 5 req | 15 min |
| Forgot Password | 3 req | 1 hour |
| Form Submit | 60 req | 1 min |
| File Upload | 30 req | 15 min |

Rate limit headers are returned: \`RateLimit-Limit\`, \`RateLimit-Remaining\`, \`RateLimit-Reset\`, \`Retry-After\`.

## Form Lifecycle
Forms follow this state machine:
\`\`\`
draft → published → archived
         ↕
       draft (unpublish)
\`\`\`

## Visibility Modes
- **public** — Listed in explore feed, accessible by anyone
- **unlisted** — Accessible via direct slug URL only, not listed
- **private** — Only accessible by the form creator

## Error Responses
All errors follow a consistent format:
\`\`\`json
{
  "error": {
    "message": "Human-readable error message",
    "code": "TRPC_ERROR_CODE"
  }
}
\`\`\`

Common error codes: \`UNAUTHORIZED\`, \`FORBIDDEN\`, \`NOT_FOUND\`, \`BAD_REQUEST\`, \`TOO_MANY_REQUESTS\`, \`CONFLICT\`, \`INTERNAL_SERVER_ERROR\`.

## Base URL
All API endpoints are prefixed with \`/api\`. The tRPC endpoint is available at \`/trpc\` for typed client usage.
`,
    baseUrl: env.BASE_URL.concat("/api"),
  });

  // Enrich the generated document with tag descriptions
  openApiDocument.tags = [
    { name: "Authentication", description: "User registration, login, logout, password reset, and session management. Public endpoints (register, login, forgot-password, reset-password) do not require authentication. Protected endpoints (me, logout) require a valid session cookie or API key." },
    { name: "Forms", description: "CRUD operations for form management. All endpoints require authentication and `write:all` scope for mutations. Forms support draft/published/archived states, custom slugs, password protection, response limits, expiry dates, and visibility controls." },
    { name: "Fields", description: "Manage form fields (questions). Supported types: short_text, long_text, email, number, date, single_select, multi_select, checkbox, rating, url, phone. Fields support custom validations, options, conditional logic, and page-based ordering." },
    { name: "Public Forms", description: "Public-facing endpoints for rendering forms to respondents. No authentication required. Handles visibility checks, password-protected form access, and automatic view tracking." },
    { name: "Public Submit", description: "Form submission endpoints for respondents. No authentication required. Supports full submission with dynamic validation, partial progress saving for multi-page forms, and form start event tracking." },
    { name: "Public Explore", description: "Browse publicly listed forms. Returns only forms with status=published and visibility=public. Supports cursor-based pagination. Results are cached for 60 seconds." },
    { name: "Responses", description: "View, manage, and export form responses. All endpoints require authentication and verify form ownership. Supports paginated listing, individual response detail, deletion, and CSV export." },
    { name: "Analytics", description: "Form analytics and insights. Provides overview stats, daily time-series data, page-level drop-off analysis, and per-field answer aggregations." },
    { name: "API Keys", description: "Manage programmatic API keys for headless/CI integrations. Keys use format sk_live_<48chars>, are SHA-256 hashed at rest, and support scoped permissions." },
    { name: "Email Settings", description: "Configure per-form email notifications for creator submission alerts and respondent confirmation emails." },
    { name: "Themes", description: "List available system themes for form styling (colors, fonts, border radius)." },
    { name: "Templates", description: "List available system form templates that users can clone as starting points." },
    { name: "Media", description: "Media upload authentication for direct client-side uploads to ImageKit CDN. Server-side uploads available at POST /api/upload (max 5MB, JPEG/PNG/WebP/GIF/PDF)." },
  ];
  logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
  app.get("/openapi.json", (req, res) => {
    return res.json(openApiDocument);
  });

  logger.debug(`docs: ${env.BASE_URL}/docs`);
  app.use("/docs", apiReference({
    url: "/openapi.json",
    title: "KOLLECTS.TECH API Reference",
    theme: "kepler",
  }));
}

import uploadRouter from "./routes/upload";
app.use("/api/upload", uploadRouter);

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
