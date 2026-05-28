import "dotenv/config";
import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";

import { env } from "./env";

async function init() {
  try {
    const server = http.createServer(expressApplication);
    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`🚀 API Server is running at: http://localhost:${PORT}`);
      logger.info(`📄 OpenAPI Document: http://localhost:${PORT}/openapi.json`);
      logger.info(`📚 Scalar API Reference: http://localhost:${PORT}/docs`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();