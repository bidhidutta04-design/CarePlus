import dns from "node:dns";
import mongoose from "mongoose";
import { config } from "./config.js";
import { formatError, logger } from "./logger.js";

// Connection events are observability only. The MongoDB driver reconnects by
// itself after a drop (monitor thread + per-operation server selection), so
// no hand-rolled retry loop is needed — that would just duplicate the driver.
let stopping = false;

mongoose.connection.on("connected", () => {
  logger.info(`mongo connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on("disconnected", () => {
  if (stopping) {
    logger.info("mongo connection closed (server stopping)");
    return;
  }
  logger.warn("mongo connection lost — driver is reconnecting in the background");
});

mongoose.connection.on("reconnected", () => {
  logger.info("mongo reconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error({ err: formatError(err) }, "mongo error");
});

export async function connectDB(uri: string = config.mongoUri): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (uri.startsWith("mongodb+srv://")) {
    try {
      // Some local networks block SRV lookups — use public DNS for those.
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Custom DNS unavailable — fall back to system resolver
    }
  }
  mongoose.set("strictQuery", true);
  return mongoose.connect(uri, {
    autoIndex: !config.isProd,
    // Atlas free tiers can be slow to wake — fail fast helps nobody here.
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
  });
}

export async function disconnectDB(): Promise<void> {
  stopping = true;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}
