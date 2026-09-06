import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDB, disconnectDB } from "./db.js";
import { formatError, logger } from "./logger.js";

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    // Never block listen() on the database — boot fast, report via /ready.
    // (Previously awaited here: with an unreachable DB the 5s driver timeout
    // delayed listen and broke health-gated CI steps with curl exit 7.)
    connectDB().catch(() => {
      // Logged + retried with backoff inside connectDB; the API serves
      // requests meanwhile and /ready reports 503 until mongo is back.
      logger.warn("api accepting requests while mongo reconnects in the background");
    });
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
