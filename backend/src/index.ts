import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDB, disconnectDB } from "./db.js";

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    try {
      await connectDB();
    } catch {
      console.warn("api starting without db — set MONGODB_URI and restart for persistence");
    }
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`careplus-api listening on http://localhost:${config.port}`);
  });

  const shutdown = async (): Promise<void> => {
    console.log("shutting down...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
  // Fail fast — a process with indeterminate state must restart clean, not limp on
  process.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection — exiting", reason);
    void disconnectDB().finally(() => process.exit(1));
  });
  process.on("uncaughtException", (err) => {
    console.error("uncaughtException — exiting", err);
    void disconnectDB().finally(() => process.exit(1));
  });
}

void main();
