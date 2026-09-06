import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDB, disconnectDB } from "./db.js";
import { formatError, logger } from "./logger.js";

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    try {
      await connectDB();
    } catch (err: unknown) {
      // Boot continues degraded: repos serve the local fallback store,
      // /ready reports 503, and the driver keeps retrying every operation
      // until mongo is back — no restart needed.
      logger.error({ err: formatError(err) }, "mongo unavailable at boot — running degraded");
    }
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`careplus-api listening on http://localhost:${config.port}`);
  });

  const shutdown = async (): Promise<void> => {
    logger.info("shutting down...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
  // Fail fast — a process with indeterminate state must restart clean, not limp on
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: formatError(reason) }, "unhandledRejection — exiting");
    void disconnectDB().finally(() => process.exit(1));
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err: formatError(err) }, "uncaughtException — exiting");
    void disconnectDB().finally(() => process.exit(1));
  });
}

void main();
