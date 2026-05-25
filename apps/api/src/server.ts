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
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "KOLLECTS.TECH OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

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

// Start background cron tasks
jobQueue.startCronTasks();

app.get("/", (req, res) => {
  return res.json({ message: "KOLLECTS.TECH is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "KOLLECTS.TECH server is healthy", healthy: true });
});

if (env.NODE_ENV !== "production") {
  logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
  app.get("/openapi.json", (req, res) => {
    return res.json(openApiDocument);
  });

  logger.debug(`docs: ${env.BASE_URL}/docs`);
  app.use("/docs", apiReference({ url: "/openapi.json" }));
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
